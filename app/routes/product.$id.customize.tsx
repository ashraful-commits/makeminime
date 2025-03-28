import { useState, useEffect } from "react";
import { IoIosArrowBack, IoIosCloseCircleOutline } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import FaceCutterApp from "~/components/FaceCutterApp";

import ImageCropper from "~/components/ImageCroper";
import ImageEditor2 from "~/components/ImageEditor2";
import ImagePreview from "~/components/ImagePreview";
import { AiOutlineArrowLeft } from "react-icons/ai";
import CameraComponent from "~/components/Camera";
import FinalPreview from "~/components/FinalPreview";
import { MetaFunction, useLoaderData, useNavigate } from "@remix-run/react";
import { convertNumberToImageLink } from "~/lib/server.utlis";
import { LoaderFunction } from "@remix-run/node";
export const meta: MetaFunction = () => {
  return [
    { title: "Product Customization" },
    { name: "description", content: "Snugzy" },
  ];
};

import { json } from "@remix-run/node";
import { Buffer } from "buffer";

// Type for product meta data
interface ProductMetaData {
  key: string;
  value: any;
}

// Type for WooCommerce product
interface WooCommerceProduct {
  meta_data: ProductMetaData[];
  [key: string]: any;
}

export const loader: LoaderFunction = async ({ params }) => {
  try {
    const { id: productId } = params;

    if (!productId) {
      throw new Response("Product ID is required", { status: 400 });
    }

    // Get environment variables
    const CONSUMER_KEY = process.env.CONSUMER_KEY_TEST;
    const CONSUMER_SECRET = process.env.CONSUMER_SECRET_TEST;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error("Missing WooCommerce API credentials");
      throw new Response("Server configuration error", { status: 500 });
    }

    // Fetch product from WooCommerce
    const product = await fetchWooCommerceProduct(
      productId,
      CONSUMER_KEY,
      CONSUMER_SECRET
    );

    // Process product frame image
    const { imageUrl } = await processProductFrameImage(product);

    return json(
      {
        imageUrl,
        productId,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error("Loader error:", error);

    if (error instanceof Response) {
      return error;
    }

    return new Response("Internal Server Error", {
      status: 500,
      statusText: "An unexpected error occurred",
    });
  }
};

// Helper function to fetch WooCommerce product
async function fetchWooCommerceProduct(
  productId: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooCommerceProduct> {
  const apiUrl = `https://makeminime.com/wp-json/wc/v3/products/${productId}`;
  const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Response(`Failed to fetch product: ${response.statusText}`, {
      status: response.status,
    });
  }

  return await response.json();
}

// Helper function to process product frame image
async function processProductFrameImage(
  product: WooCommerceProduct
): Promise<{ imageUrl: string }> {
  const productFrame = product.meta_data?.find(
    (item) => item.key === "product_frame"
  );

  if (!productFrame?.value) {
    throw new Response("Product frame not found", { status: 404 });
  }

  const productFrameImage = await convertNumberToImageLink(productFrame.value);

  if (!productFrameImage) {
    throw new Response("Invalid product frame image", { status: 404 });
  }

  const imageResponse = await fetch(productFrameImage);

  if (!imageResponse.ok) {
    throw new Response("Failed to fetch product frame image", {
      status: imageResponse.status,
    });
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const contentType = imageResponse.headers.get("Content-Type") || "image/jpeg";

  return {
    imageUrl: `data:${contentType};base64,${base64Image}`,
  };
}

export default function ProductIdCustomize() {
  const [images, setImages] = useState<string[]>([]);
  const { imageUrl, productId } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedImages = localStorage.getItem("finalImage");
      if (savedImages) {
        setImages(JSON.parse(savedImages));
      } else {
        setImages([]);
      }
    }
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const [bodyImage, setBodyImage] = useState<string>("");
  const [uploadedPhoto, setUploadedPhoto] = useState<string>("");
  const [croppedImage, setCropedImage] = useState<string>("");
  const [skinTone, setSkinTone] = useState<string>(
    "invert(71%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)"
  );
  const [step, setStep] = useState<number>(0);

  const handleClearPhotos = () => {
    // Clear images from state and localStorage
    setImages([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("finalImage", JSON.stringify([])); // Clear the localStorage
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const updatedImages = prev.filter((_, i) => i !== index);

      // Update localStorage with the new images array after removal
      if (typeof window !== "undefined") {
        localStorage.setItem("finalImage", JSON.stringify(updatedImages));
      }

      return updatedImages;
    });
  };

  const handleUploadPhoto = (e: any) => {
    const file = e.target.files[0];

    if (file) {
      const objectURL = URL.createObjectURL(file);
      setUploadedPhoto(objectURL);
      setStep(1);
      localStorage.setItem("uploadImage", objectURL);
    }
  };
  const handleTakePhoto = (e: any) => {
    setStep(6);
  };

  useEffect(() => {
    const storedImage = localStorage.getItem("uploadImage");

    if (storedImage) {
      setUploadedPhoto(storedImage);
    }
  }, []);

  // image frame load from loader
  useEffect(() => {
    if (imageUrl) {
      setBodyImage(imageUrl);
    }
  }, [imageUrl]);

  //  edit photo
  const handleEdit = (index) => {
    setStep(3);
    const storedImage = localStorage.getItem("finalImage");
    const imageArray = storedImage ? JSON.parse(storedImage) : [];
    setCropedImage(imageArray[index]);
  };

  useEffect(() => {
    const storedImage = localStorage.getItem("finalImage");
    setImages(storedImage ? JSON.parse(storedImage) : []);
  }, [step]);
  const skinTones = [
    {
      id: 1,
      filter:
        "invert(91%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 2,
      filter:
        "invert(95%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 3,
      filter:
        "invert(81%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 4,
      filter:
        "invert(85%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 5,
      filter:
        "invert(71%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 6,
      filter:
        "invert(75%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 7,
      filter:
        "invert(61%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 8,
      filter:
        "invert(65%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 9,
      filter:
        "invert(51%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 10,
      filter:
        "invert(55%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 11,
      filter:
        "invert(41%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 12,
      filter:
        "invert(45%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 13,
      filter:
        "invert(31%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 14,
      filter:
        "invert(35%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 15,
      filter:
        "invert(21%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 16,
      filter:
        "invert(25%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 17,
      filter:
        "invert(11%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
    {
      id: 18,
      filter:
        "invert(5%) sepia(51%) saturate(280%) hue-rotate(340deg) brightness(86%) contrast(88%)", // Light Yellow
    },
  ];
  const handleConfirm = () => {
    setStep(7);
  };
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleConfirmExit = (confirm: boolean) => {
    if (confirm) {
      window.location.href = "https://makeminime.com";
    } else {
      setShowPopup(false);
    }
  };

  const handleBeforeUnload = () => {
    if (unsavedChanges) {
      const message =
        "You have unsaved changes. Do you want to leave without saving?";
      e.returnValue = message;
      return message;
    }
  };

  useEffect(() => {
    if (unsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChanges]);

  return (
    <div className="h-screen max-sm:h-auto  text-black min-h-[80vh]">
      {/* Exit Link */}
      {loading ? (
        <div className="loader w-full h-full flex flex-col justify-center items-center">
          <img src="/images/happiness.png" alt="" />
          <p>Let's get this Started...</p>
          <p>Personalisation Tool is Loading</p>
        </div>
      ) : (
        <>
          {showPopup && (
            <div className="popup bg-gray-900 fixed inset-0 bg-opacity-80 flex justify-center items-center z-20">
              <div className=" bg-white p-8 rounded-lg shadow-xl w-96 max-w-md">
                <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
                  Are you sure you want to exit?
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  your design will be lost
                </p>
                <div className="flex justify-around gap-4">
                  <button
                    onClick={() => handleConfirmExit(true)}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
                  >
                    Yes, Leave
                  </button>
                  <button
                    onClick={() => handleConfirmExit(false)}
                    className="px-4 py-2 text-sm bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="w-full h-12 px-10 flex justify-start items-center border-b border-gray-300 max-sm:sticky top-0 bg-white z-10 ">
            <button
              onClick={() => setShowPopup(true)}
              className="flex items-center gap-1 font-normal"
            >
              <IoIosArrowBack />
              Exit
            </button>
          </div>

          {/* Main Section */}
          <div className="flex gap-2 max-sm:flex-col justify-center items-center min-h-[80vh]">
            {/* Left Section - Image Preview */}
            <ImageEditor2
              faceImage={croppedImage}
              bodyImage={bodyImage}
              skinTone={skinTone}
              step={step}
              setStep={setStep}
              productId={productId}
            />

            {/* Right Section - Upload/Take Photo */}
            {croppedImage && step == 3 && (
              <ImagePreview
                croppedImage={croppedImage}
                setUploadedPhoto={setUploadedPhoto}
                setCropedImage={setCropedImage}
                step={step}
                setStep={setStep}
              />
            )}

            {uploadedPhoto && step == 1 && (
              <div className="w-[50%] max-h-[50vh] max-sm:w-full flex flex-col items-center justify-center relative">
                {uploadedPhoto && (
                  <ImageCropper
                    src={uploadedPhoto}
                    setUploadedPhoto={setUploadedPhoto}
                    setCropedImage={setCropedImage}
                    setStep={setStep}
                  />
                )}
              </div>
            )}
            {step === 0 && (
              <div className="w-[50%] max-sm:w-full flex flex-col items-center justify-center">
                <label
                  htmlFor="uploadphoto"
                  className="mt-10 text-blue-500 font-semibold min-w-[200px] px-10 py-6 bg-blue-200 bg-opacity-50 border border-blue-500  hover:text-white hover:bg-blue-600 rounded-md shadow-sm cursor-pointer flex justify-center items-center"
                >
                  Upload Photo
                </label>
                <input
                  type="file"
                  onChange={handleUploadPhoto}
                  className="hidden"
                  name="uploadphoto"
                  id="uploadphoto"
                />
                <button
                  onClick={handleTakePhoto}
                  className="mt-3 min-w-[200px] px-10 py-6 bg-green-200 font-semibold hover:bg-green-600 rounded-md shadow-sm  cursor-pointer text-green-500 bg-opacity-50 border border-green-500  flex justify-center items-center hover:text-white"
                >
                  Take Photo
                </button>

                <span className="mt-5 text-sm font-light ">
                  For any tips follow our guide{" "}
                  <a className="hover:underline text-blue-900" href="/here">
                    here
                  </a>
                </span>

                <p className="mt-10 text-md text-gray-500">
                  You have {images.length} uploaded{" "}
                  {images.length === 1 ? "image" : "images"}
                </p>

                {/* Uploaded Images Section */}
                <div className="w-full px-5 mt-10">
                  {images.length > 0 && (
                    <div className="flex justify-between items-center">
                      <h6 className="font-semibold">Uploaded Images</h6>
                      {images.length > 0 && (
                        <button
                          className="text-blue-500 underline font-semibold"
                          onClick={handleClearPhotos}
                        >
                          Clear photos
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex gap-3 flex-wrap">
                    {images.map((item, index) => (
                      <div
                        key={index}
                        className="relative flex flex-col items-center"
                      >
                        <button
                          className="absolute top-[-8px] right-[-8px] bg-white text-red-500 rounded-full p-1 hover:text-red-700"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <IoIosCloseCircleOutline className="text-2xl" />
                        </button>
                        <img
                          className="w-20 h-20 object-cover rounded"
                          src={item}
                          alt={`Uploaded ${index + 1}`}
                        />
                        <button
                          onClick={() => handleEdit(index)}
                          className="underline text-sm font-light  mt-2  hover:text-blue-500"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && skinTone && (
              <div className="w-full max-w-md mx-auto flex space-y-3 flex-col items-center justify-center p-6">
                {/* Section Title and Navigation Buttons */}
                <div className="flex gap-4 mb-5 justify-between items-center w-full">
                  <button
                    className="px-3 py-1 text-sm font-light   text-gray-50 bg-gray-500 rounded-md hover:bg-gray-600 "
                    onClick={() => setStep(3)}
                  >
                    Adjust color
                  </button>
                  <button
                    className="px-2 py-1 text-sm font-light text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    onClick={() => setStep(0)}
                  >
                    Change Face
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-blue-100 bg-opacity-50 border border-blue-500 text-blue-500 hover:text-white text-sm font-light  px-2 py-1 rounded-md  hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <AiOutlineArrowLeft className="inline-block mr-2" />
                    Back
                  </button>
                </div>

                {/* Skin Tone Selection Grid */}
                <div className="grid grid-cols-4 gap-4 w-full justify-center items-center border p-4">
                  {skinTones.map((tone) => (
                    <button
                      key={tone.id}
                      className="w-8 h-8 rounded-full"
                      style={{
                        backgroundColor: "black",
                        filter: tone.filter,
                      }}
                      onClick={() => {
                        setSkinTone(tone.filter),
                          localStorage.setItem("skinTone", tone.filter);
                      }}
                      aria-label={`Select skin tone ${tone.id}`}
                    />
                  ))}
                </div>
                {/* Action Buttons */}
                <div className="w-full flex justify-end gap-6 items-center mt-10">
                  <button
                    onClick={handleConfirm}
                    className="bg-blue-100 bg-opacity-50 border border-blue-500 text-blue-500 hover:text-white text-sm font-light  px-2 py-1 rounded-md  hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <FaCheck className="inline-block mr-2" />
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {step === 5 && croppedImage && (
              <FaceCutterApp
                faceImage={croppedImage}
                setStep={setStep}
                setCropedImage={setCropedImage}
              />
            )}

            {step === 6 && (
              <CameraComponent
                setStep={setStep}
                setCropedImage={setCropedImage}
                setUploadedPhoto={setUploadedPhoto}
              />
            )}
            {step === 7 && (
              <FinalPreview
                setStep={setStep}
                croppedImage={croppedImage}
                skinTone={skinTone}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
