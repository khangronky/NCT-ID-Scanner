"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import VideoCapture from "@/components/VideoCapture";
import StudentList from "@/components/StudentList";
import AddStudentModal from "@/components/AddStudentModal";
import { IStudent } from "@/lib/models/Student";
import Link from "next/link";

export default function Page() {
  const [students, setStudents] = useState<IStudent[]>(() => {
    if (typeof window !== "undefined") {
      const storedStudents = localStorage.getItem("students");
      return storedStudents ? JSON.parse(storedStudents) : [];
    }
    return [];
  });

  const [captureError, setCaptureError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [editID, setEditID] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editStudentNumber, setEditStudentNumber] = useState<string>("");
  const [editProgram, setEditProgram] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  const createStudentRecord = (studentData: {
    name: string;
    studentNumber: string;
    program: string;
  }): IStudent => {
    return {
      id: uuidv4(),
      name: studentData.name.trim(),
      studentNumber: studentData.studentNumber.trim(),
      program: studentData.program ? studentData.program.trim() : "",
      timestamp: new Date().toLocaleString(),
    };
  };

  const handleNewStudent = (name: string, studentNumber: string) => {
    const existingEntryIndex = students.findIndex(
      (item) => item.studentNumber.trim() === studentNumber.trim()
    );

    if (existingEntryIndex !== -1) {
      const updatedList = [...students];
      updatedList[existingEntryIndex] = {
        ...createStudentRecord({
          name,
          studentNumber,
          program: students[existingEntryIndex].program,
        }),
        id: students[existingEntryIndex].id,
      };
      setStudents(updatedList);
      setCaptureError("");
    } else {
      setStudents([
        ...students,
        createStudentRecord({ name, studentNumber, program: "" }),
      ]);
      setCaptureError("");
    }
  };

  const handleAdd = (name: string, studentNumber: string, program: string) => {
    if (!name || !studentNumber) {
      setAddError("Please enter name and student number");
      return;
    }

    setStudents([
      ...students,
      createStudentRecord({ name, studentNumber, program }),
    ]);
    setAddError("");
    setIsModalOpen(false);
  };

  const handleEdit = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    setEditID(id);
    setEditName(student.name);
    setEditStudentNumber(student.studentNumber);
    setEditProgram(student.program);
  };

  const handleSave = () => {
    if (editStudentNumber === null) return;

    const updatedList = students.map((student) =>
      student.id === editID
        ? createStudentRecord({
            name: editName,
            studentNumber: editStudentNumber,
            program: editProgram,
          })
        : student
    );

    setStudents(updatedList);
    setEditID(null);
    setEditName("");
    setEditStudentNumber("");
    setEditProgram("");
  };

  const handleDelete = (id: string) => {
    const updatedList = students.filter((s) => s.id !== id);
    setStudents(updatedList);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Student Number", "Program", "Timestamp"];
    const csvRows = [
      headers.join(","),
      ...students.map(
        (item) =>
          `${item.name},${item.studentNumber},${item.program},${item.timestamp}`
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "CapturedStudents.csv");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setStudents([]);
  };

  const handleUpload = async () => {
    setUploadError("");
    setUploadSuccess("");

    const uploadPromises = students.map((student) =>
      axios.post("http://localhost:3000/api/students", {
        name: student.name,
        studentNumber: student.studentNumber,
        program: student.program,
        timestamp: student.timestamp,
      })
    );

    try {
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads = results.filter(
        (result) => result.status === "fulfilled"
      );

      if (successfulUploads.length > 0) {
        const remainingStudents = students.filter((_, index) => {
          const result = results[index];
          return result.status === "rejected";
        });
        setStudents(remainingStudents);
        setUploadSuccess(
          `Successfully uploaded ${successfulUploads.length} student(s)`
        );
      }
    } catch (error) {
      console.error("Error uploading students:", error);
      setUploadError("Failed to upload students to database");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 md:w-1/2 p-2">
        <VideoCapture
          error={captureError}
          setError={setCaptureError}
          handleNewStudent={handleNewStudent}
        />
      </div>

      <div className="flex-1 md:w-1/2 p-2">
        <StudentList
          students={students}
          editID={editID}
          editStudentNumber={editStudentNumber}
          editName={editName}
          editProgram={editProgram}
          setEditName={setEditName}
          setEditStudentNumber={setEditStudentNumber}
          setEditProgram={setEditProgram}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleDelete={handleDelete}
          exportToCSV={exportToCSV}
          handleAdd={() => setIsModalOpen(true)}
        />
        <AddStudentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setAddError(null);
          }}
          onAdd={handleAdd}
          error={addError}
        />
        <div className="flex justify-center mt-4 gap-4">
          <button
            className={`px-4 py-2 bg-red-600 text-white rounded-lg ${
              students.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700 transition"
            }`}
            disabled={students.length === 0}
            onClick={handleClear}
          >
            Clear History
          </button>
          <button
            className={`px-4 py-2 bg-green-600 text-white rounded-lg ${
              students.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-700 transition"
            }`}
            disabled={students.length === 0}
            onClick={handleUpload}
          >
            Upload to Database
          </button>
        </div>
        {uploadError && (
          <div className="p-4 text-center text-red-500">{uploadError}</div>
        )}
        {uploadSuccess && (
          <div className="p-4 text-center text-green-500">{uploadSuccess}</div>
        )}
        <div className="flex justify-center mt-4">
          <Link href="/idlist">
            <button className="bg-[#4896ac] hover:bg-[#326979] text-white px-4 py-2 rounded-lg">
              View all students
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
