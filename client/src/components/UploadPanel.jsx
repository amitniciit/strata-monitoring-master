import { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Link } from 'react-router-dom';


const UploadPanel = () => {
     const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        const isJsonByName = selected?.name?.toLowerCase().endsWith('.json');
        const isJsonByType = selected?.type === 'application/json';

        if (!selected || (!isJsonByName && !isJsonByType)) {
            toast.error('Please select a valid .json file.');
            setFile(null);
            e.target.value = '';
            return;
        }

        setFile(selected);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) return toast.error('Please select a JSON file.');

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/upload/panel`;

            await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Panel uploaded successfully.');

            setFile(null);
            const input = document.getElementById('panel-json-input');
            if (input) input.value = '';

        } catch (err) {
            console.log('Error uploading file', err);
            toast.error('Error uploading file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: 16, maxWidth: 800 }}>
            <Link
                to="/"
                style={{
                    display: 'inline-block',
                    marginBottom: '20px',
                    backgroundColor: '#1d4ed8',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                    fontWeight: 500
                }}
            >
                ← Back to Home
            </Link>
            <h1>Upload a panel</h1>

            <ToastContainer position="bottom-right" />

            <form onSubmit={handleUpload}>
                {/* File Input */}
                <div style={{ marginBottom: 12 }}>
                    <input
                        id="panel-json-input"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileChange}
                        style={{ display: 'inline-block' }}
                    />
                </div>

                {file && (
                    <div style={{ marginBottom: 12 }}>
                        <strong>Selected file:</strong> {file.name} (
                        {Math.round(file.size / 1024)} KB)
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        disabled={uploading}
                        style={{
                            backgroundColor: '#007bff',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: !file || uploading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                        }}
                        onMouseOver={(e) =>
                        (e.target.style.backgroundColor =
                            uploading ? '#007bff' : '#0056b3')
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = '#007bff')
                        }
                    >
                        {uploading ? 'Uploading...' : 'Upload Panel'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFile(null);
                            const input =
                                document.getElementById('panel-json-input');
                            if (input) input.value = '';
                        }}
                        style={{
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                        onMouseOver={(e) =>
                            (e.target.style.backgroundColor = '#5a6268')
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = '#6c757d')
                        }
                    >
                        Reset
                    </button>
                </div>
            </form>

            <div style={{ marginTop: 14, color: '#666', fontSize: 13 }}>
                Note: only <strong>.json</strong> files are accepted.
            </div>
        </div>
    );
};

export default UploadPanel;


