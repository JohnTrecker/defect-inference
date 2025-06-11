'use client';

import axios from 'axios';

import {useCallback, useState } from 'react';
import JSONViewer from './JsonViewer';
import WoodImage from './WoodImage';
import Report from './Report';
import AllImages from './AllImages';
import { Defect, Features, Inference, SavedImages, ServerResponse, undertrainedDefects } from './types';
import { cropImage } from './helpers/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';

const INIT_OUTPUT = {
  inference_id: '',
  time: 0,
  image: {width: 0, height: 0},
  predictions: [],
}

export default function Home() {
  const [format, setFormat] = useState<'json' | 'image'>('image')
  const [output, setOutput] = useState<Inference>(INIT_OUTPUT);
  const [notification, setNotification] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [inputImagePreview, setInputImagePreview] = useState<string>('');
  const [savedImages, setSavedImages] = useState<SavedImages>([]);
  // const [inputLabel, setInputLabel] = useState<'Select File' | 'Type URL'>('Select File');
  const [features, setFeatures] = useState<Features>({
    // board_heartwood: false,
    board_whitewood: true,
    board_rot: true,
    board_streak: true,
    board_knot: true,
    board_firescar: true,
    board_wormhole: false,
    board_flagworm: false,
    board_want: false,
    board_bark: false,
    board_beltmark: false,
    // board_rot_or_firescar: true,
  });

  // State for form values
  const [formData, setFormData] = useState({
    apiKey: '',
    model: '',
    format: 'image',
    fileName: '',
    url: '',
    classes: '',
    confidence: '50',
    overlap: '50',
    uploadMethod: 'upload', // 'upload' or 'url'
    labels: 'off',
    stroke: '5',
    version: '1',
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    // Save certain values to localStorage
    if (['api_key', 'model', 'format'].includes(id)) {
      localStorage.setItem(`rf.${id}`, value);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        fileName: file.name
      }));

      // Create preview URL for the input image
      const previewUrl = URL.createObjectURL(file);
      setInputImagePreview(previewUrl);
      setOutput(INIT_OUTPUT)
    }

  };

  // Handle method button clicks
  // const handleMethodClick = (method: 'upload' | 'url') => {
  //   setFormData(prev => ({ ...prev, uploadMethod: method }));
  //   setInputLabel(method === 'upload' ? 'Select File' : 'Type URL')
  // };

  // Get form data
  const getSettingsFromForm = useCallback(async () => {
    // Get the file if upload method is selected
    const fileInput = document.getElementById('file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    // Add file size check and resizing
    const fileToUpload = await convertToBase64(file);

    // Prepare the form data
    const data = new FormData();

    if (formData.uploadMethod === 'upload' && fileToUpload) {
      data.append('file', fileToUpload);
    } else if (formData.uploadMethod === 'url' && formData.url) {
      data.append('image_url', formData.url);
    }

    // Add other parameters
    data.append('confidence', formData.confidence);
    data.append('overlap', formData.overlap);
    data.append('stroke', formData.stroke);
    data.append('labels', formData.labels);

    if (formData.classes) {
      data.append('classes', formData.classes);
    }

    // Construct the API URL
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${formData.model}`;
    const queryParams = new URLSearchParams({
      api_key: formData.apiKey,
      format: formData.format
    });

    return {
      url: `${baseUrl}?${queryParams.toString()}`,
      data,
      image: fileToUpload
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fileName]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification('Inferring...');
    setShowResult(true);

    try {
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (formData.uploadMethod === 'upload' && !fileInput?.files?.[0]) {
        throw new Error('Please select a file to upload');
      }

      const {image} = await getSettingsFromForm();

      const response = await axios({
        method: "POST",
        url: '/api',
        data: { image },
      });

      const data: ServerResponse = response.data;

      // Convert canvas to base64
      const croppedImage = await cropImage(image, data);

      // Update the preview with cropped image
      setInputImagePreview(croppedImage);

      // Update output with the response data
      setOutput({
        inference_id: data.inferenceId,
        image: {
          width: data.cropped?.width ?? data.original?.width ?? 0,
          height: data.cropped?.height ?? data.original?.height,
        },
        predictions: data.defects,
        time: data.time,
      });
      setSavedImages((prev) => [
        ...prev,
        {
          image: croppedImage,
          data: {
            inference_id: data.inferenceId,
            image: {
              width: data.cropped?.width ?? data.original?.width ?? 0,
              height: data.cropped?.height ?? data.original?.height ?? 0,
            },
            predictions: data.defects,
            time: data.time,
          },
          file: formData.fileName,
        }
      ]);
      setNotification('');
    } catch (error) {
      const specific = error instanceof Error ? error.message : undefined
      const generic = [
        "Check your API key, model, version,",
        "and other parameters",
        "then try again."
      ].join('\n')
      setNotification([
        "Error loading response.",
        "",
        specific ?? generic
      ].join("\n"));
      console.log('Error submitting form: ', error)
    }
  }, [formData.fileName, getSettingsFromForm]);

  const convertToBase64 = async (file: File | undefined): Promise<string> => {
    if (!file) {
      throw new Error('No file selected');
    }
    // First convert to base64 to work with image data
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Create image element to get dimensions
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const img = document.createElement('img');
      img.onload = () => resolve(img);
      img.src = base64;
    });

    // Check if resizing is needed
    const maxSize = 1024;
    let width = img.width;
    let height = img.height;

    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert back to base64
      return canvas.toDataURL('image/jpeg', 0.9);
    }

    return base64;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center sm:items-start">
        <form id="inputForm" onSubmit={handleFormSubmit}>
          <div className="header flex text-xl font-medium">
            <div className='flex-col'>
              <h1 className="text-2xl font-bold">Model v1.3.0</h1>
              <p className="text-sm text-gray-600 mt-2">Average Precision (mAP@50) - 54.7%</p>
            </div>
          </div>

          <div className="content">
            <div className="flex flex-wrap w-full gap-14">
              {/* <div className="w-full sm:w-1/2 md:w-1/3" id="method">
                <label className="input__label">Upload Method</label>
                <div>
                  <button
                    data-value="upload"
                    id="computerButton"
                    className={`bttn left fill ${formData.uploadMethod === 'upload' ? 'active' : ''}`}
                    onClick={() => handleMethodClick('upload')}
                  >
                    Upload
                  </button>
                  <button
                    data-value="url"
                    id="urlButton"
                    className={`bttn right fill ${formData.uploadMethod === 'url' ? 'active' : ''}`}
                    onClick={() => handleMethodClick('url')}
                  >
                    URL
                  </button>
                </div>
              </div> */}

              <div className="w-full md:w-2/3" id="fileSelectionContainer">
                {/* <label className="input__label" htmlFor="file">{inputLabel}</label> */}
                <label className="input__label" htmlFor="file">Select File</label>
                <div className="flex">
                  <input
                    className="input input--left flex-1"
                    type="text"
                    id="fileName"
                    autoComplete="off"
                    value={formData.fileName}
                    onChange={handleInputChange}
                  />
                  {/* {
                    inputLabel === "Select File" && ( */}
                      <button id="fileMock" className="bttn right active" onClick={() => document.getElementById('file')?.click()} type="button">
                        Browse
                      </button>
                    {/* )
                  } */}
                </div>
                <input
                  style={{ display: "none" }}
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                />
              </div>

              <div className="w-full md:w-2/3" id="urlContainer">
                <label className="input__label" htmlFor="file">Enter Image URL</label>
                <div className="flex">
                  <input type="text" id="url" placeholder="https://path.to/your.jpg" className="input" value={formData.url}
                    onChange={handleInputChange} />
                </div>
              </div>

              <div className="w-1/2 md:w-1/4" id="format">
                <label className="input__label">Inference Result</label>
                <div>
                  <button id="imageButton" onClick={() => setFormat('image')} data-value="image" className={`bttn left fill ${format === 'image' ? 'active' : ''}`} type="button">Image</button>
                  <button id="jsonButton" onClick={() => setFormat('json')} data-value="json" className={`bttn right fill ${format === 'json' ? 'active' : ''}`} type="button">JSON</button>
                </div>
              </div>

              <div className="w-full" id="labels">
                <label className="input__label">Labels</label>
                <div className="flex flex-wrap gap-4">
                  { Object.keys(features).map((feature) => {
                    const isDisabled = undertrainedDefects.includes(feature as Defect)

                    return (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={feature}
                          className="w-5 h-5 border border-[#cbd5e0] rounded cursor-pointer appearance-none checked:bg-white relative
                          after:content-['✕'] after:absolute after:top-1/2 after:left-1/2 after:transform after:-translate-x-1/2 after:-translate-y-1/2 
                          after:opacity-0 checked:after:opacity-100 after:text-[#606FC7] checked:border-[#606FC7] transition-colors"
                          checked={features[feature as keyof Features]}
                          onChange={(e) => setFeatures(prev => ({
                            ...prev,
                            [feature]: e.target.checked,
                          }))}
                          disabled={isDisabled}
                        />
                        {isDisabled && (
                          <div className="absolute -top-1 -right-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="h-4 w-4 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center">
                                  !
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="max-w-[200px] p-2 rounded-md shadow-md bg-white border">
                                  <p className="text-xs">{`${feature.replace('board_', '').toLocaleUpperCase()} defects underrepresented in training data.`}</p>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                      <label htmlFor={feature} className="text-sm capitalize">
                        {feature.replace('board_', '')}
                      </label>
                    </div>
                  )})}
                </div>
              </div>

              {/* <div className="w-full flex flex-wrap" id="imageOptions">
                <div className="w-full sm:w-1/2 md:w-1/3" id="stroke">
                  <label className="input__label">Stroke Width</label>
                  <div>
                    <button data-value="1" className="bttn left">1px</button>
                    <button data-value="2" className="bttn">2px</button>
                    <button data-value="5" className="bttn active">5px</button>
                    <button data-value="10" className="bttn right">10px</button>
                  </div>
                </div>
              </div> */}

              <div className="w-full">
                <button value="Run Inference" onClick={handleFormSubmit} className="bttn__primary mr-54" type="button">Run Inference</button>
                {savedImages.length > 1 && <AllImages images={savedImages} features={features}/>}
              </div>
            </div>

            <div className="result" id="resultContainer" style={{ display: showResult ? 'block' : 'none' }}>
              <div className="divider"></div>
              {/* <div className="result__header">
                <h3 className="headline">Result</h3>
                <a href="#">Copy Code</a>
              </div> */}
              <div className="flex flex-col gap-4 mb-4">
                {
                  output?.predictions.length > 0
                    ? (
                      <div id="output" className="codeblock">
                        <Report output={output} />
                      </div>
                    ) : (
                      <p id="output" className="codeblock">{notification}</p>
                    )
                }
                {/* <h4 className="text-sm font-medium mb-2">Detected Objects:</h4> */}
                {
                  format === 'json' ? (
                    <JSONViewer data={output} />
                  ) : (
                      <WoodImage image = { inputImagePreview } data = { output } features = { features } />
                  )
                }
                {/* {inputImagePreview && } */}
                {/* {inputImagePreview && (
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-2">Input Image:</h4>
                    <img src={inputImagePreview} alt="Input preview" className="max-w-full h-auto" />
                  </div>
                )}
                {outputImagePreview && (
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-2">Detected Objects:</h4>
                    <img src={outputImagePreview} alt="Output preview" className="max-w-full h-auto" />
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}