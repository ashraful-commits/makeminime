import { useRef, useEffect, useState } from "react";
import { FaCartPlus } from "react-icons/fa";
import html2canvas from "html2canvas";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
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
  step,
  productId,
}) => {
  // Refs
  const canvasBodyRef = useRef(null);
  const canvasSkinToneRef = useRef(null);
  const canvasHeadBackRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);


  // Default images
  const defaultBodyImage = bodyImage || "/images/SN-044_copy_2_preview.png";
  const defaultSkitToneImage =
    SkitToneImage || "/images/Snugzy_Shape_preview.png";
  const defaultHeadBackImage = headBackImage || "/images/headblack_preview.png";
  const defaultFaceImage = faceImage;
  const defaultSkinTone = skinTone || "grayscale(100%)";

  // State
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.7);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const drawImageOnCanvas = (canvasRef, imageSrc, filter = "none") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
  
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = filter;
  
      const width = canvas.width;
      const height = canvas.height;
  
      const targetAspect = width / height;
      const imgAspect = image.naturalWidth / image.naturalHeight;
  
      let drawWidth, drawHeight;
  
      if (imgAspect > targetAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
      }
  
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
  
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
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
      const imageWidth = imageElement.naturalWidth;
      const imageHeight = imageElement.naturalHeight;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

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

  // Event handlers
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

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    setScale((prev) =>
      e.deltaY > 0 ? Math.max(prev - 0.01, 0.01) : prev + 0.01
    );
  };

  const handleRotate = (direction) => {
    setRotation((prev) => prev + direction * 5);
  };

  const handleMove = (direction) => {
    const moveMap = {
      up: { y: -5 },
      down: { y: 5 },
      left: { x: -5 },
      right: { x: 5 },
    };

    setImagePosition((prev) => ({
      ...prev,
      ...moveMap[direction],
    }));
  };

  const handleAddToCart = async (id) => {
    if (!containerRef.current) return;
    setLoading(true);

    try {
      const canvasImage = await html2canvas(containerRef.current, {
        useCORS: true,
        backgroundColor: "transparent",
      });

      const dataUrl = canvasImage.toDataURL("image/png");
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { result: cloudinaryUrl } = await uploadResponse.json();
      const encodeUrl = encodeURIComponent(cloudinaryUrl);

      // Sync with WordPress
      await fetch(
        `https://makeminime.com/wp-json/custom/v1/set-image?image=${encodeUrl}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      window.location.href = `https://makeminime.com/?add-to-cart=${id}&quantity=1&image=${encodeUrl}`;
      setStep(0);
    } catch (error) {
      console.error("Error:", error);
      window.location.href = `https://makeminime.vercel.app/product/${id}/customize`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col border-r border-r-gray-500 items-center justify-center w-[50%] max-sm:w-full z-0 min-h-[90vh]">
      <div
        className="relative w-full flex justify-center items-center  bg-center bg-no-repeat max-sm:scale-75 "
       

      >
        <div
          ref={containerRef}
          className="relative w-[557px] h-[800px] flex justify-center items-center top-0  "
        >
          {/* Background Layers */}
          <canvas
            ref={canvasHeadBackRef}
            width={"557px"}
            height={"800px"}
            className="absolute z-10 h-full"
          />

          {/* Face Image */}
          {faceImage ? (
            <canvas
              id="canvasRef"
              ref={canvasRef}
              width={"300px"}
              height={"455px"}
              className=" absolute top-3 hover:cursor-grab hover:border-[6px] rounded-full border-[6px] border-transparent hover:border-yellow-500 hover:border-dotted z-40"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            />
          ) : (
            <img
              className="top-10 absolute max-h-[350px] z-40"
              src="/images/Layer_40_face_preview.png"
              alt="face preview"
            />
          )}

          {/* Other Layers */}
          <canvas
            ref={canvasSkinToneRef}
            width={"557px"}
            height={"800px"}
            className="absolute z-0 h-full "
          />
          <canvas
            ref={canvasBodyRef}
            width={"557px"}
            height={"800px"}
            className=" absolute z-20 h-full " 
          />
        </div>
      </div>

      {/* Controls */}
      {step === 7 && (
        <>
          <div className="flex gap-4 mt-10 absolute right-10 bottom-10 max-sm:bottom-0">
            <button
              onClick={() => handleAddToCart(productId)}
              className="bg-green-600 text-white px-6 py-3 flex justify-center items-center rounded-md text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin inline-block mr-2" />
              ) : (
                <FaCartPlus className="inline-block mr-2" />
              )}
              Add to Basket
            </button>
          </div>

          <div className="controls mt-20">
            <div className="flex gap-2">
              <ControlButton
                onClick={() => handleRotate(1)}
                icon={<FaSync />}
              />
              <ControlButton
                onClick={() => handleRotate(-1)}
                icon={<FaSync className="rotate-180" />}
              />
              <ControlButton
                onClick={() => handleMove("up")}
                icon={<FaArrowAltCircleUp />}
              />
              <ControlButton
                onClick={() => handleMove("down")}
                icon={<FaArrowAltCircleDown />}
              />
              <ControlButton
                onClick={() => setScale((p) => p + 0.01)}
                icon={<FaPlus />}
              />
              <ControlButton
                onClick={() => setScale((p) => Math.max(p - 0.01, 0.01))}
                icon={<FaMinus />}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Reusable control button component
const ControlButton = ({ onClick, icon, className = "" }) => (
  <button
    onClick={onClick}
    className={`bg-gray-600 text-white px-2 py-1 text-sm rounded-md hover:bg-gray-700 flex items-center gap-2 ${className}`}
  >
    {icon}
  </button>
);

export default ImageEditor;
