'use client';

import axios from 'axios';
import {useState } from 'react';
import JSONViewer from './JsonViewer';

export default function Home() {
  const [format, setFormat] = useState<'json' | 'image'>('json')
  const [output, setOutput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [inputImagePreview, setInputImagePreview] = useState<string>('');
  const [outputImagePreview, setOutputImagePreview] = useState<string>('');

  // State for form values
  const [formData, setFormData] = useState({
    apiKey: '',
    model: '',
    format: 'json',
    fileName: '',
    url: '',
    classes: '',
    confidence: '50',
    overlap: '50',
    uploadMethod: 'upload', // 'upload' or 'url'
    labels: 'off',
    stroke: '1',
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
    }

  };

  // Handle method button clicks
  const handleMethodClick = (method: 'upload' | 'url') => {
    setFormData(prev => ({ ...prev, uploadMethod: method }));
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput('Inferring...');
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
        data: {image},
      });

      if (formData.format === 'json') {
        setOutput(JSON.stringify(response.data, null, 4));

        // Draw masks on input image
        if (inputImagePreview && response.data.predictions) {
          const maskedImage = await drawMasksOnImage(
            inputImagePreview,
            response.data.predictions
          );
          setOutputImagePreview(maskedImage);
        }
      } else {
        const arrayBuffer = response.data;
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setOutput(`<img src="${imageUrl}" />`);
      }
    } catch (error) {
      setOutputImagePreview(''); // Clear output preview on error
      const specific = error instanceof Error ? error.message : undefined
      const generic = [
        "Check your API key, model, version,",
        "and other parameters",
        "then try again."
      ].join('\n')
      setOutput([
        "Error loading response.",
        "",
        specific ?? generic
      ].join("\n"));
      console.log('Error submitting form: ', error)
    }
  };

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
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = base64;
    });

    // Check if resizing is needed
    const maxSize = 800;
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


  const getSettingsFromForm = async () => {
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
  };

  // Add function to draw masks on canvas
  const drawMasksOnImage = async (imageUrl: string, predictions: any[]) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw each prediction
        predictions.forEach(pred => {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; // Red with 0.8 opacity
          ctx.lineWidth = parseInt(formData.stroke);

          // Draw polygon if points exist
          if (pred.points && pred.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(pred.points[0].x, pred.points[0].y);
            pred.points.forEach((point: { x: number, y: number }) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();
            ctx.stroke();

            // Add label if enabled
            if (formData.labels === 'on') {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.font = '14px Arial';
              ctx.fillText(
                `${pred.class} (${(pred.confidence * 100).toFixed(1)}%)`,
                pred.points[0].x,
                pred.points[0].y - 5
              );
            }
          }
        });

        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.src = imageUrl;
    });
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">

        <form id="inputForm" onSubmit={handleFormSubmit}>
          <div className="header">
            {/* <div className="header__grid">
              <div>
                <label className="header__label" htmlFor="model">Model</label>
                <input
                  className="input"
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="header__label" htmlFor="version">Version</label>
                <input
                  className="input"
                  type="number"
                  id="version"
                  value={formData.version}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="header__label" htmlFor="api_key">API Key</label>
                <input
                  className="input"
                  type="text"
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                />
              </div>
            </div> */}
            <h1>Select an image for defect detection</h1>
          </div>

          <div className="content">
            <div className="content__grid">
              <div className="col-12-s6-m4" id="method">
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
                  <button data-value="url" id="urlButton" className="bttn right fill">URL</button>
                </div>
              </div>

              <div className="col-12-m8" id="fileSelectionContainer">
                <label className="input__label" htmlFor="file">Select File</label>
                <div className="flex">
                  <input className="input input--left flex-1" type="text" id="fileName" disabled value={formData.fileName}
                    onChange={handleInputChange} />
                  <button id="fileMock" className="bttn right active" onClick={() => document.getElementById('file')?.click()} >Browse</button>
                </div>
                <input
                  style={{ display: "none" }}
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                />
              </div>

              <div className="col-12-m8" id="urlContainer">
                <label className="input__label" htmlFor="file">Enter Image URL</label>
                <div className="flex">
                  <input type="text" id="url" placeholder="https://path.to/your.jpg" className="input" value={formData.url}
                    onChange={handleInputChange} /><br/>
                </div>
              </div>

              <div className="col-12-m6">
                <label className="input__label" htmlFor="classes">Filter Classes</label>
                <input type="text" id="classes" placeholder="Enter class names" className="input" value={formData.classes}
                  onChange={handleInputChange} /><br/>
                <span className="text--small">Separate names with commas</span>
              </div>

              <div className="col-6-m3 relative">
                <label className="input__label" htmlFor="confidence">Min Confidence</label>
                <div>
                  <i className="fas fa-crown"></i>
                  <span className="icon">%</span>
                  <input type="number" id="confidence" max="100" step={2} min="0" className="input input__icon" value={formData.confidence}
                    onChange={handleInputChange} /></div>
                </div>
              <div className="col-6-m3 relative">
                <label className="input__label" htmlFor="overlap">Max Overlap</label>
                <div>
                  <i className="fas fa-object-ungroup"></i>
                  <span className="icon">%</span>
                  <input type="number" id="overlap" max="100" step={2} min="0" className="input input__icon" value={formData.overlap}
                    onChange={handleInputChange} /></div>
                </div>
              <div className="col-6-m3" id="format">
                <label className="input__label">Inference Result</label>
                <div>
                  <button id="imageButton" onClick={() => setFormat('image')} data-value="image" className={`bttn left fill ${format === 'image' ? 'active' : ''}`}>Image</button>
                  <button id="jsonButton" onClick={() => setFormat('json')} data-value="json" className={`bttn right fill ${format === 'json' ? 'active' : ''}`}>JSON</button>
                </div>
              </div>
              <div className="col-12 content__grid" id="imageOptions">
                <div className="col-12-s6-m4" id="labels">
                  <label className="input__label">Labels</label>
                  <div>
                    <button className="bttn left active">Off</button>
                    <button data-value="on" className="bttn right">On</button>
                  </div>
                </div>
                <div className="col-12-s6-m4" id="stroke">
                  <label className="input__label">Stroke Width</label>
                  <div>
                    <button data-value="1" className="bttn left active">1px</button>
                    <button data-value="2" className="bttn">2px</button>
                    <button data-value="5" className="bttn">5px</button>
                    <button data-value="10" className="bttn right">10px</button>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <button type="submit" value="Run Inference" className="bttn__primary">Run Inference</button>
              </div>
            </div>
            <div className="result" id="resultContainer" style={{ display: showResult ? 'block' : 'none' }}>
              <div className="divider"></div>
              <div className="result__header">
                <h3 className="headline">Result</h3>
                <a href="#">Copy Code</a>
              </div>
              <div className="flex gap-4 mb-4">
                {inputImagePreview && (
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
                )}
              </div>
              {outputImagePreview && output ? (
                  <JSONViewer data={output} />
                ) : (
                  <pre id="output" className="codeblock" dangerouslySetInnerHTML={{ __html: output }} />
                )}
              </div>
          </div>

        </form>

      </main>
      {/* <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer> */}
    </div>
  );
}
