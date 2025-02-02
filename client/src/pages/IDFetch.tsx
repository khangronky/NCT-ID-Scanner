import React, { useEffect, useState } from "react";
import { IDInfo } from "../types/interfaces";
import VideoCapture from "../components/VideoCapture";
import StudentList from "../components/StudentList";
import AddStudentModal from "../components/AddStudentModal";

const IDFetch: React.FC = () => {
  const [idList, setIdList] = useState<IDInfo[]>(() => {
    const storedList = JSON.parse(localStorage.getItem("idList") || "[]");
    return storedList;
  });

  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editStudentNumber, setEditStudentNumber] = useState<string>("");
  const [editProgram, setEditProgram] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [newStudentNumber, setNewStudentNumber] = useState<string>("");
  const [newProgram, setNewProgram] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    localStorage.setItem("idList", JSON.stringify(idList));
  }, [idList]);

  const createStudentRecord = (studentData: {
    name: string;
    studentNumber: string;
    program: string;
  }) => {
    return {
      name: studentData.name.trim(),
      studentNumber: studentData.studentNumber.trim(),
      program: studentData.program ? studentData.program.trim() : "",
      timestamp: new Date().toLocaleString(),
    };
  };

  const handleNewID = (newIDInfo: IDInfo) => {
    const existingEntryIndex = idList.findIndex(
      (item) => item.studentNumber.trim() === newIDInfo.studentNumber.trim()
    );

    if (existingEntryIndex !== -1) {
      if (
        idList[existingEntryIndex].name.trim().toLowerCase() !==
        newIDInfo.name.trim().toLowerCase()
      ) {
        const updatedList = [...idList];
        updatedList[existingEntryIndex] = createStudentRecord({
          name: newIDInfo.name,
          studentNumber: newIDInfo.studentNumber,
          program: newIDInfo.program,
        });
        setIdList(updatedList);
        setError(null);
      } else {
        setError("This record already exists in the list.");
      }
    } else {
      setIdList([...idList, createStudentRecord(newIDInfo)]);
      setError(null);
    }
  };

  const handleAdd = () => {
    if (!newName || !newStudentNumber) {
      setError("Please enter name and student number");
      return;
    }

    const existingEntry = idList.find(
      (item) => item.studentNumber.trim() === newStudentNumber.trim()
    );

    if (existingEntry) {
      setError("This record already exists in the list.");
      return;
    }

    setIdList([
      ...idList,
      createStudentRecord({
        name: newName,
        studentNumber: newStudentNumber,
        program: newProgram,
      }),
    ]);
    
    setNewName("");
    setNewStudentNumber("");
    setNewProgram("");
    setIsModalOpen(false);
    setError(null);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditName(idList[index].name);
    setEditStudentNumber(idList[index].studentNumber);
    setEditProgram(idList[index].program);
  };

  const handleSave = () => {
    if (editIndex === null) return;

    const updatedList = [...idList];
    updatedList[editIndex] = createStudentRecord({
      name: editName,
      studentNumber: editStudentNumber,
      program: editProgram,
    });
    
    setIdList(updatedList);
    setEditIndex(null);
    setEditName("");
    setEditStudentNumber("");
    setEditProgram("");
  };

  const handleDelete = (index: number) => {
    const updatedList = idList.filter((_, i) => i !== index);
    setIdList(updatedList);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Student Number", "Program", "Timestamp"];
    const csvRows = [
      headers.join(","),
      ...idList.map(
        (item) => `${item.name},${item.studentNumber},${item.program},${item.timestamp}`
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "Student_Info_List.csv");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-center min-h-screen bg-[#f2fafc]">
      <div className="w-full md:w-4/5 p-4 bg-[#e8f5fc]/80 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          NEO Culture Technology ID Scanner
        </h1>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 md:w-1/2 p-2">
            <VideoCapture
              error={error}
              setError={setError}
              handleNewID={handleNewID}
            />
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#4896ac] hover:bg-[#326979] text-white rounded-lg transition"
              >
                Add Manually
              </button>
            </div>
          </div>

          <div className="flex-1 md:w-1/2 p-2">
            <StudentList
              idList={idList}
              editIndex={editIndex}
              editName={editName}
              editStudentNumber={editStudentNumber}
              editProgram={editProgram}
              setEditName={setEditName}
              setEditStudentNumber={setEditStudentNumber}
              setEditProgram={setEditProgram}
              handleEdit={handleEdit}
              handleSave={handleSave}
              handleDelete={handleDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              exportToCSV={exportToCSV}
            />
          </div>
        </div>

        <AddStudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          newName={newName}
          setNewName={setNewName}
          newStudentNumber={newStudentNumber}
          setNewStudentNumber={setNewStudentNumber}
          newProgram={newProgram}
          setNewProgram={setNewProgram}
          handleAdd={handleAdd}
        />
      </div>
    </div>
  );
};

export default IDFetch; 