import { useState, useRef } from 'react';
import { Video, Music, Upload, X, Play, Pause } from 'lucide-react';

function MediaPlayer({ files, type, onAddFile, onRemoveFile }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mediaUrl, setMediaUrl] = useState(null);
    const mediaRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                onAddFile({
                    name: file.name,
                    type: file.type,
                    file: file
                });
            }
        }
        e.target.value = '';
    };

    const handlePlayFile = async (fileRef) => {
        if (selectedFile?.name === fileRef.name && mediaUrl) {
            // Toggle play/pause
            if (isPlaying) {
                mediaRef.current?.pause();
                setIsPlaying(false);
            } else {
                mediaRef.current?.play();
                setIsPlaying(true);
            }
            return;
        }

        // If we have a stored file object, create URL
        if (fileRef.file) {
            if (mediaUrl) {
                URL.revokeObjectURL(mediaUrl);
            }
            const url = URL.createObjectURL(fileRef.file);
            setMediaUrl(url);
            setSelectedFile(fileRef);
            setIsPlaying(true);
        }
    };

    const handleMediaEnded = () => {
        setIsPlaying(false);
    };

    const Icon = type === 'video' ? Video : Music;
    const accept = type === 'video' ? 'video/*' : 'audio/*';

    return (
        <div className="media-section">
            {/* File List */}
            {files.length > 0 && (
                <div className="media-files-list">
                    {files.map((file, index) => (
                        <div key={index} className="media-file-item">
                            <Icon />
                            <span className="media-file-name">{file.name}</span>
                            {file.file && (
                                <button
                                    className="btn btn-icon btn-secondary"
                                    onClick={() => handlePlayFile(file)}
                                    title={selectedFile?.name === file.name && isPlaying ? 'Pause' : 'Play'}
                                >
                                    {selectedFile?.name === file.name && isPlaying ? <Pause /> : <Play />}
                                </button>
                            )}
                            <button
                                className="btn btn-icon btn-secondary"
                                onClick={() => onRemoveFile(index)}
                                title="Remove"
                            >
                                <X />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Media Player */}
            {mediaUrl && selectedFile && (
                <div className="media-player-container" style={{ marginTop: '16px', marginBottom: '16px' }}>
                    {type === 'video' ? (
                        <video
                            ref={mediaRef}
                            src={mediaUrl}
                            controls
                            autoPlay
                            onEnded={handleMediaEnded}
                            style={{ maxHeight: '400px' }}
                        />
                    ) : (
                        <audio
                            ref={mediaRef}
                            src={mediaUrl}
                            controls
                            autoPlay
                            onEnded={handleMediaEnded}
                            style={{ width: '100%', padding: '16px' }}
                        />
                    )}
                </div>
            )}

            {/* Upload Zone */}
            <div
                className="drop-zone"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload />
                <p className="drop-zone-text">
                    Click to select {type} files
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
}

export default MediaPlayer;
