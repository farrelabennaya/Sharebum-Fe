import React from "react";
import { Card } from "./ui/Card";
import UploadDropzone from "../components/UploadDropzone.jsx";

export default function UploadPanel({ albumId, pageId, onUploaded }) {
  return (
    <Card>
      <h3 className="font-semibold mb-3">Upload</h3>
      <UploadDropzone albumId={albumId} pageId={pageId} onDone={onUploaded} />
    </Card>
  );
}
