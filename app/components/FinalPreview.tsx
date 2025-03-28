import React from "react";
import { FaPlus } from "react-icons/fa";

interface FinalPreviewProps {
  croppedImage?: string;
  skinTone: string;
  setStep: (step: number) => void;
}

const FinalPreview: React.FC<FinalPreviewProps> = ({ croppedImage, skinTone, setStep }) => {
  const handleAddNewFace = () => {
    setStep(0);
  };

  return (
    <div className="w-[50%] max-sm:w-full justify-center flex flex-col items-start space-y-4 min-h-full px-5 max-sm:mb-20">
      {croppedImage && (
        <div className="flex justify-center items-center gap-3">
          <p className="text-blue-500 text-lg">Face:</p>
          <img className="w-32 h-auto" src={croppedImage} alt="Cropped face" />
        </div>
      )}
      <div className="flex justify-start items-center gap-3">
        <p className="text-blue-500 text-lg text-start">Skin Tone:</p>
        <div className="w-10 h-10 bg-black rounded-full" style={{ filter: skinTone }}></div>
      </div>
      <button
        onClick={handleAddNewFace}
        className="flex border border-blue-500 bg-blue-200 bg-opacity-50 text-sm px-4 py-1 text-blue-500 hover:text-white hover:bg-blue-500 transition-all duration-200 rounded-md justify-center items-center gap-2"
      >
        <FaPlus /> Add face
      </button>
    </div>
  );
};

export default FinalPreview;