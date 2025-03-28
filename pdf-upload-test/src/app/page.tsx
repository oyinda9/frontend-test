"use client";

import PDFViewer from "../app/components/pdfViewer";

export default function Home() {
  return (
    <div className="min-h-screen p-6 bg-black">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        PDF Annotation Tool
      </h1>
      <div className="lg:w-3/5 bg-black p-4 rounded-lg shadow-md">
        <PDFViewer />
      </div>
    </div>
  );
}
