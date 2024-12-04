'use client';

import { useEffect, useState } from 'react';
import axios from 'axios'

export default function Home() {

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
  const [output, setOutput] = useState('');
  const [showResult, setShowResult] = useState(false);

  // Load default values from localStorage
  useEffect(() => {
    try {
      const apiKey = process.env.REACT_APP_API_KEY ?? localStorage.getItem('rf.api_key');
      const model = process.env.REACT_APP_MODEL_DETECT_URL ?? localStorage.getItem('rf.model');

      setFormData(prev => ({
        ...prev,
        apiKey: apiKey || '',
        model: model || '',
      }));
    } catch (e) {
      console.log('Unable to set form data with env variables. ', e)
    }
  }, []);

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
      const settings = await getSettingsFromForm();
      const {image} = settings
      console.log({settings})
      const response = await axios({
        method: "POST",
        url: `${process.env.REACT_APP_BASE_URL}/${process.env.REACT_APP_MODEL_DETECT_URL}/${process.env.REACT_APP_MODEL_VERSION}`,
        params: {
          api_key: process.env.REACT_APP_MODEL_API_KEY,
        },
        data: image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      })

      console.log(response.data);

      if (formData.format === 'json') {
        setOutput(JSON.stringify(response.data, null, 4));
      } else {
        const arrayBuffer = response.data;
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setOutput(`<img src="${imageUrl}" />`);
      }
    } catch (error) {
      setOutput([
        "Error loading response.",
        "",
        "Check your API key, model, version,",
        "and other parameters",
        "then try again."
      ].join("\n"));

      console.log('Error submitting form: ', error)
    }
  };

  // const resizeImage = async (file: File): Promise<File> => {
  //   return new Promise((resolve) => {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const img = new Image();
  //       img.onload = () => {
  //         const canvas = document.createElement('canvas');
  //         let width = img.width;
  //         let height = img.height;

  //         // Calculate new dimensions while maintaining aspect ratio
  //         const maxSize = 1500; // Max dimension for either width or height
  //         if (width > height && width > maxSize) {
  //           height = (height * maxSize) / width;
  //           width = maxSize;
  //         } else if (height > maxSize) {
  //           width = (width * maxSize) / height;
  //           height = maxSize;
  //         }

  //         canvas.width = width;
  //         canvas.height = height;

  //         const ctx = canvas.getContext('2d');
  //         ctx?.drawImage(img, 0, 0, width, height);

  //         canvas.toBlob((blob) => {
  //           if (blob) {
  //             resolve(new File([blob], file.name, {
  //               type: 'image/jpeg',
  //               lastModified: Date.now(),
  //             }));
  //           }
  //         }, 'image/jpeg', 0.7); // Adjust quality to get file size under 3MB
  //       };
  //       img.src = e.target?.result as string;
  //     };
  //     reader.readAsDataURL(file);
  //   });
  // };

  const convertToBase64 = (file: File | undefined): Promise<string> => {
    if (!file) return Promise.resolve('');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const getSettingsFromForm = async () => {
    // Get the file if upload method is selected
    const fileInput = document.getElementById('file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    // Add file size check and resizing
    const fileToUpload = await convertToBase64(file);
    // if (file && file.size > 2.9 * 1024 * 1024) { // 3MB in bytes
      // fileToUpload = await convertTobase64(file);
    // }

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
    const baseUrl = `${process.env.REACT_APP_BASE_URL}/${formData.model}`;
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

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">

        <form id="inputForm" onSubmit={handleFormSubmit}>
          <div className="header">
            <div className="header__grid">
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
            </div>
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
                  <button id="imageButton" data-value="image" className="bttn left fill active">Image</button>
                  <button id="jsonButton" data-value="json" className="bttn right fill">JSON</button>
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
              <pre id="output" className="codeblock" dangerouslySetInnerHTML={{ __html: output }} />
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
