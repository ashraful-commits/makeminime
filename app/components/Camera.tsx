import { useState } from "react";
import Camera from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { FaArrowLeft } from "react-icons/fa";

interface CameraComponentProps {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setUploadedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
}

const CameraComponent: React.FC<CameraComponentProps> = ({ setStep, setUploadedPhoto }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTakePhoto = (dataUri: string) => {
    setIsLoading(true);
    setUploadedPhoto(dataUri);
    localStorage.setItem("uploadImage", dataUri);
    setTimeout(() => {
      setStep(1);
      setIsLoading(false);
    }, 500);
  };

  const handleBack = () => {
    setStep(0);
  };

  return (
    <div className="w-[50%] max-sm:w-full flex flex-col items-center justify-center border-gray-300 lg:border-r md:border-r max-sm:border-b min-h-[80vh] p-4 bg-white rounded-lg relative">
      <h2 className="text-lg font-light text-blue-500 mb-4">
        Capture Your Photo
      </h2>
      <div className="relative w-full border border-blue-500 p-3 rounded-md">
        <Camera
          onTakePhoto={handleTakePhoto}
          isImageMirror={false}
          imageType="jpg"
          imageCompression={0.9}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 text-white font-semibold">
            Processing...
          </div>
        )}
      </div>
      <button
        onClick={handleBack}
        className="mt-4 px-4 py-2 flex items-center gap-2 bg-blue-300 border border-blue-500 hover:text-white rounded-lg text-blue-500 hover:bg-blue-500 bg-opacity-50 transition duration-300 text-sm font-light"
      >
        <FaArrowLeft /> Back to upload
      </button>
    </div>
  );
};

export default CameraComponent;
