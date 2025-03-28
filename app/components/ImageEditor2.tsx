import { useRef, useEffect, useState } from "react";
import { FaCartPlus } from "react-icons/fa";
import html2canvas from "html2canvas";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import {
  FaArrowAltCircleUp,
  FaArrowAltCircleDown,
  FaPlus,
  FaMinus,
  FaSync,
} from "react-icons/fa";

const ImageEditor = ({
  faceImage,
  bodyImage,
  skinTone,
  SkitToneImage,
  headBackImage,
  setStep,
  step,productId
}) => {
  const canvasBodyRef = useRef(null);
  const canvasSkinToneRef = useRef(null);
  const canvasHeadBackRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const defaultBodyImage = bodyImage || "/images/SN-044_copy_2_preview.png";

  const defaultSkitToneImage =
    SkitToneImage || "/images/Snugzy_Shape_preview.png";
  const defaultHeadBackImage = headBackImage || "/images/headblack_preview.png";
  const defaultFaceImage = faceImage;
  const defaultSkinTone = skinTone || "grayscale(100%)";

  const width = 230;
  const height = 330;

  // Transformations
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.7);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLaoding] = useState(false);

  const drawImageOnCanvas = (canvasRef, imageSrc, filter = "none") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.background = "transparent";
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = filter;
      ctx.drawImage(image, 0, 0, width, height);
    };
  };

  useEffect(() => {
    drawImageOnCanvas(canvasBodyRef, defaultBodyImage);
    drawImageOnCanvas(canvasSkinToneRef, defaultSkitToneImage, defaultSkinTone);
    drawImageOnCanvas(canvasHeadBackRef, defaultHeadBackImage);
  }, [
    defaultBodyImage,
    defaultSkitToneImage,
    defaultSkinTone,
    defaultHeadBackImage,
  ]);

  useEffect(() => {
    if (!canvasRef.current || !defaultFaceImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const imageElement = new Image();
    imageElement.src = defaultFaceImage;
    imageElement.crossOrigin = "anonymous";

    imageElement.onload = () => {
      // Get natural dimensions of the image
      const imageWidth = imageElement.naturalWidth;
      const imageHeight = imageElement.naturalHeight;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Clear canvas before drawing the new image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Move the canvas origin to the center for rotation
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180); // Rotate image around center
      ctx.scale(scale, scale); // Apply scale to zoom in/out from center

      // Draw the image centered on the canvas with its natural size
      ctx.drawImage(
        imageElement,
        -imageWidth / 2 + imagePosition.x,
        -imageHeight / 2 + imagePosition.y,
        imageWidth,
        imageHeight
      );
      ctx.restore();
    };
  }, [defaultFaceImage, imagePosition, scale, rotation]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = e.clientX - rect.left - dragStart.x;
    const dy = e.clientY - rect.top - dragStart.y;
    setImagePosition((prevPos) => ({
      x: prevPos.x + dx,
      y: prevPos.y + dy,
    }));
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      setScale((prevScale) => Math.max(prevScale - 0.01, 0.01)); // Zoom out
    } else {
      setScale((prevScale) => prevScale + 0.01); // Zoom in
    }
  };

  const handleRotate = (direction) => {
    setRotation((prevRotation) => prevRotation + direction * 5); // Rotate by 15 degrees
  };

  const handleMove = (direction) => {
    switch (direction) {
      case "up":
        setImagePosition((prevPos) => ({ ...prevPos, y: prevPos.y - 5 }));
        break;
      case "down":
        setImagePosition((prevPos) => ({ ...prevPos, y: prevPos.y + 5 }));
        break;
      case "left":
        setImagePosition((prevPos) => ({ ...prevPos, x: prevPos.x - 5 }));
        break;
      case "right":
        setImagePosition((prevPos) => ({ ...prevPos, x: prevPos.x + 5 }));
        break;
      default:
        break;
    }
  };
  const handleAddToCart = async (id:string) => {
 
    if (!containerRef.current) return;
 setLaoding(true)
    try {
      // Generate the image from the canvas
      const canvasImage = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: "transparent",
      });

      // Get the base64 data URL
      const dataUrl = canvasImage.toDataURL("image/png");

      // 1. Upload to Cloudinary first
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!uploadResponse.ok) {
        setLaoding(false)
        throw new Error("Cloudinary upload failed");
      }

      const { result: cloudinaryUrl } = await uploadResponse.json();
     
        console.log(`cloudinaryUrl`,cloudinaryUrl)
      if(cloudinaryUrl){
        const encodeUrl = encodeURIComponent(cloudinaryUrl);
        fetch(`https://makeminime.com/wp-json/custom/v1/set-image?image=${encodeUrl}`, {
          method: "GET",
          credentials: "include", // Cookie Allow করার জন্য
      });
  
        window.location.href = `https://makeminime.com/?add-to-cart=${id}&quantity=1&image=${encodeUrl}`;
      }else{
        window.location.href= `https://makeminime.vercel.app/product/${id}/customize`
      }

      if (!uploadResponse.ok) {
        setLaoding(false)
        throw new Error("Cloudinary upload failed");
      }

      setStep(0);
      setLaoding(false)
    } catch (error) {
      setLaoding(false);
      console.error("Error processing image:", error);
      // Handle error (show toast/alert)
    }
  };

  

  return (
    <div className="flex flex-col border-r border-r-gray-500 items-center justify-center w-[50%] max-sm:w-full z-0 min-h-[90vh]">
      <div
        className="relative w-full flex justify-center items-center bg-contain bg-center bg-no-repeat"
        style={{ height: "60vh", minHeight: "60vh", maxHeight: "auto" }}
      >
        <div
          ref={containerRef}
          className="relative w-[380px] h-[650px] flex justify-center items-start top-0"
        >
          <canvas
            className="absolute top-0 w-full h-full z-10"
            ref={canvasHeadBackRef}
            width={width}
            height={height}
          ></canvas>

          {faceImage ? (
            <canvas
              id="canvasRef"
              className="top-0 absolute max-h-[370px] hover:cursor-grab hover:border-4 rounded-full border-4 border-transparent hover:border-yellow-500 hover:border-dotted z-40"
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            ></canvas>
          ) : (
            <img
              className="top-10 absolute max-h-[250px] z-40"
              src="/images/Layer_40_face_preview.png"
              alt="faceimage"
            />
          )}
          <canvas
            className="absolute w-full h-full"
            ref={canvasSkinToneRef}
            width={width}
            height={height}
          ></canvas>
          <canvas
            className="absolute bottom-0 left-0 w-full h-full"
            ref={canvasBodyRef}
            width={width}
            height={height}
          ></canvas>
        </div>
      </div>
      {step === 7 && (
        <div className="flex gap-4 mt-10 absolute right-10 bottom-10 max-sm:bottom-0">
          <button
            onClick={() => handleAddToCart(productId)}
            className="bg-green-600 text-white px-6 py-3 rounded-md text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {loading ?  <AiOutlineLoading3Quarters className="animate-spin" /> :  <FaCartPlus className="inline-block mr-2" />}
            Add to Basket
          </button>
        </div>
      )}

     {step===7 && <div className="controls mt-20">
        <div className="flex gap-2">
          <button
            onClick={() => handleRotate(1)}
            className="bg-blue-600 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaSync className="inline-block text-sm font-light" />
          </button>
          <button
            onClick={() => handleRotate(-1)}
            className="bg-blue-600 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaSync className="inline-block transform rotate-180" />
          </button>
       
          <button
            onClick={() => handleMove("up")}
            className="bg-gray-600 text-white px-2 py-1 text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <FaArrowAltCircleUp className="inline-block text-sm font-light" />
          </button>
          <button
            onClick={() => handleMove("down")}
            className="bg-gray-600 text-white px-2 py-1 text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <FaArrowAltCircleDown className="inline-block text-sm font-light" />
          </button>

          <button
            onClick={() => setScale((prevScale) => prevScale + 0.01)}
            className="bg-gray-600 text-white px-2 py-1 text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <FaPlus className="inline-block text-sm font-light" />
          </button>
          <button
            onClick={() =>
              setScale((prevScale) => Math.max(prevScale - 0.01, 0.01))
            }
            className="bg-gray-600 text-white px-2 py-1 text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <FaMinus className="inline-block text-sm font-light" />
          </button>
        </div>
      </div>}
    </div>
  );
};

export default ImageEditor;
