import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { removeBackground } from "@imgly/background-removal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaBrush, FaCheck } from "react-icons/fa"; // Added for brush, undo, and redo icons
import { IoArrowBackOutline } from "react-icons/io5"; // Added for the back button
const FaceCutterApp = ({ faceImage, setStep, setCropedImage }) => {
  const [removeBG, setRemoveBG] = useState(null);
  const [error, setError] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);
  const imageRef = useRef(null);
  const [removeLoader, setRemoveLoader] = useState(false);
  const [saveLoader, setSaveLoader] = useState(false);
  const base64ToBlob = (base64String) => {
    const byteCharacters = atob(base64String.split(',')[1]); // Remove header
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: "image/png" });
  };
  const createCanvas = () => {
    if (!canvasInstance.current) {
      canvasInstance.current = new fabric.Canvas(canvasRef.current, {
        height: 400,
        width: 600,
        backgroundColor: "white",
      });
    }

    return () => {
      if (canvasInstance.current) {
        canvasInstance.current.dispose();
        canvasInstance.current = null;
      }
    };
  };

  useEffect(() => {
    console.log(removeBG)
    const loadImage = () => {
      if (removeBG instanceof Blob || removeBG instanceof File) {
        const reader = new FileReader();

        reader.onload = () => {
          let imageElement = document.createElement("img");
          imageElement.src = reader.result;

          imageElement.onload = function () {
            let image = new fabric.Image(imageElement);
            image.scaleToWidth(canvasInstance.current.width);
            image.scaleToHeight(canvasInstance.current.height);
            imageRef.current = image;
            canvasInstance.current.add(image);
            canvasInstance.current.centerObject(image);
            canvasInstance.current.setActiveObject(image);
          };
        };

        reader.readAsDataURL(removeBG);
      } else if (typeof removeBG === "string") {
        let imageElement = document.createElement("img");
        imageElement.src = removeBG;

        imageElement.onload = function () {
          let image = new fabric.Image(imageElement);
          image.scaleToWidth(canvasInstance.current.width);
          image.scaleToHeight(canvasInstance.current.height);
          imageRef.current = image;
          canvasInstance.current.add(image);
          canvasInstance.current.centerObject(image);
          canvasInstance.current.setActiveObject(image);
        };
      }
    };

    loadImage();
  }, [removeBG]);
 
  const toggleErase = () => {
    setIsErasing((prev) => !prev);
    if (canvasInstance.current) {
      if (isErasing) {
        canvasInstance.current.isDrawingMode = false;
        canvasInstance.current.freeDrawingBrush = null;
      } else {
        canvasInstance.current.isDrawingMode = true;
        const eraseBrush = new fabric.PencilBrush(canvasInstance.current);
        eraseBrush.width = brushSize;
        eraseBrush.color = "white";
        eraseBrush.erase = true;
        canvasInstance.current.freeDrawingBrush = eraseBrush;
      }
    }
  };

  const handleBrushSizeChange = (event) => {
    setBrushSize(event.target.value);
    if (canvasInstance.current && isErasing) {
      canvasInstance.current.freeDrawingBrush.width = event.target.value;
    }
  };

  const saveErasedImage = async () => {
    if (!canvasInstance.current) return;
  
    setIsErasing((prev) => !prev);
    setSaveLoader(true);
  
    try {
      // Convert the edited canvas image to base64
      const editedImage = canvasInstance.current.toDataURL("image/png");
  
      if (!editedImage) throw new Error("Failed to convert canvas to image");
  
      // Convert base64 to Blob
      const imageBlob = base64ToBlob(editedImage);
      const formData = new FormData();
      formData.append("image", imageBlob, "faceImage.png");
  
      // Send image to API
      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        setError("add perfect image")
        // throw new Error("API Error")
      }
  
      // Convert response to Blob and create object URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
  
      // Update state with processed image
      setCropedImage(url);
      setStep(3);
    } catch (error) {
      console.error("Image saving failed:", error);
    } finally {
      setSaveLoader(false); // Ensure loader is stopped regardless of success/failure
    }
  };
  
  // const handleRemoveBg = () => {
  //   setRemoveLoader(true);
  //   removeBackground(faceImage)
  //     .then((blob) => {
  //       console.log(blob)
  //       const url = URL.createObjectURL(blob);
  //       setRemoveBG(url);
  //       console.log(url)
  //       setCropedImage(url);
  //       setRemoveLoader(false);
  //       createCanvas();
  //     })
  //     .catch((error) => {
  //       setRemoveLoader(false);
  //       console.error("Error during background removal:", error);
  //     });
  // };

  const handleRemoveBg = async () => {
    try {
      setRemoveLoader(true);
      
      if (!faceImage.startsWith("data:image")) {
        throw new Error("Invalid image format");
      }
  
      const imageBlob = base64ToBlob(faceImage);
      const formData = new FormData();
      formData.append("image", imageBlob, "faceImage.png");
  
      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        setError("Pelase add perfect image!")
        // throw new Error("API Error")
      }
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setRemoveBG(url);
        setCropedImage(url);
        setRemoveLoader(false);
        createCanvas();
    } catch (error) {
      console.error("Background removal failed:", error);
    } finally {
      setRemoveLoader(false);
    }
  };
  

  const handleBack = () => {
    setStep(1);
    setError("")
  };
  const handleConfirm = () => {
    setStep(3);
    setError("")
  };
console.log(error)
  return (
    <div className="w-[50%] max-sm:w-full flex space-y-10 flex-col items-center justify-center border-gray-300 lg:border-r md:border-r max-sm:border-b min-h-[80vh] p-4 bg-white  rounded-lg relative">
      <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
        Edit you photo
      </h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      {!removeBG && (
        <div className="w-full h-[35vh] flex justify-center items-center">
          <img
            src={faceImage}
            className="w-auto h-auto border-2 max-h-[300px] p-3"
            alt="faceImage"
          />
        </div>
      )}

      <div className="flex justify-center max-sm:flex-col gap-4 mb-6 mt-20">
        {!error&& removeBG && (
          <button
            onClick={toggleErase}
            className={`px-2 py-1 rounded-sm text-sm  flex justify-cener items-center gap-2 transition-colors font-light ${
              isErasing
                ? "bg-red-200 border border-red-500 text-red-500 hover:text-white hover:bg-red-700 bg-opacity-50"
                : "bg-blue-200 border border-blue-500 text-blue-500 hover:text-white hover:bg-blue-700 bg-opacity-50"
            }`}
          >
            {isErasing ? (
              <>
                <FaBrush className="mr-2" /> Stop Erasing
              </>
            ) : (
              <>
                <FaBrush className="mr-2" /> Start Erasing
              </>
            )}
          </button>
        )}

        {!error&& isErasing && removeBG && (
          <div className="flex items-center gap-2">
            <label htmlFor="brushSize" className="text-sm font-light  text-gray-700">
              Brush Size
            </label>
            <input
              type="range"
              id="brushSize"
              min="5"
              max="50"
              value={brushSize}
              onChange={handleBrushSizeChange}
              className="w-32"
            />
          </div>
        )}

        { !error&& removeBG && (
          <button
            onClick={saveErasedImage}
            className="px-2 py-1 gap-1 bg-blue-200 border border-blue-500 text-blue-500 hover:text-white hover:bg-blue-700 bg-opacity-50 text-sm font-light rounded-md flex justify-center items-center gap-2"
          >
            {saveLoader && (
              <AiOutlineLoading3Quarters className="animate-spin" />
            )}
            {saveLoader ? "Wait less than 1 min" : "Save Edit"}
          </button>
        )}

        {!removeBG && (
          <button
            onClick={handleRemoveBg}
            className="px-2 py-1 text-sm gap-1  rounded-sm bg-blue-100  hover:bg-blue-700 text-blue-500 bg-opacity-50 border hover:text-white border-blue-500 font-medium flex items-center justify-center"
          >
            {removeLoader && (
              <AiOutlineLoading3Quarters className="animate-spin" />
            )}
            {removeLoader ? "Wait less than 1 min" : "Remove Bacground"}
          </button>
        )}
        
        <button
          onClick={handleBack}
          className="px-2 py-1 text-sm  rounded-md bg-gray-100  hover:bg-gray-700 text-gray-500 bg-opacity-50 border hover:text-white border-gray-500 font-medium flex items-center justify-center "
        >
          <IoArrowBackOutline className="mr-2" /> Back
        </button>
        {!error&&  <button
          onClick={handleConfirm}
          className="px-2 py-1 text-sm  rounded-md bg-gray-100  hover:bg-blue-700 text-blue-500 bg-opacity-50 border hover:text-white border-blue-500 font-medium flex items-center justify-center "
        >
          <FaCheck className="mr-2" /> confirm
        </button>}
      </div>


        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-md" />
        </div>
  
    </div>
  );
};

export default FaceCutterApp;
