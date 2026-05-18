/**
 * Laifu Design — File Workspace 组件
 * 浏览和编辑项目文件
 */

import { useState, useEffect } from 'react';

interface FileItem {
  path: string;
  size: number;
  mtime: number;
  isDirectory?: boolean;
}

interface FileWorkspaceProps {
  /** 项目 ID */
  projectId: string;
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

function FileWorkspace({ projectId, open, onClose }: FileWorkspaceProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // 加载文件列表
  useEffect(() => {
    if (!open || !projectId) return;

    setLoading(true);
    fetch(`http://127.0.0.1:7456/api/projects/${projectId}/files`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.files) {
          // 按路径排序，目录优先
          const sorted = [...data.files].sort((a: FileItem, b: FileItem) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.path.localeCompare(b.path);
          });
          setFiles(sorted);
        }
      })
      .catch((err) => {
        console.error('Failed to load files:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, projectId]);

  // 加载文件内容
  useEffect(() => {
    if (!selectedFile || !projectId) return;

    fetch(`http://127.0.0.1:7456/api/projects/${projectId}/files/${selectedFile}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.content !== undefined) {
          setFileContent(data.content);
          setEditContent(data.content);
        }
      })
      .catch((err) => {
        console.error('Failed to load file content:', err);
      });
  }, [selectedFile, projectId]);

  const handleSaveFile = async () => {
    if (!selectedFile || !projectId) return;

    try {
      const res = await fetch(`http://127.0.0.1:7456/api/projects/${projectId}/files/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await res.json();
      if (data.ok) {
        setFileContent(editContent);
        setEditing(false);
      } else {
        alert('保存失败: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      alert('保存失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] h-[80vh] flex overflow-hidden">
        {/* Sidebar - File List */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-medium">文件</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">加载中...</div>
            ) : files.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">暂无文件</div>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${selectedFile === file.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-muted'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span>{file.isDirectory ? '📁' : '📄'}</span>
                      <span className="truncate flex-1">{file.path}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.size)} · {formatDate(file.mtime)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main - File Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-medium truncate">{selectedFile || '选择文件查看'}</h3>
            {selectedFile && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveFile}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditContent(fileContent);
                        setEditing(false);
                      }}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-muted"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted"
                  >
                    编辑
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {!selectedFile ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                请从左侧选择文件
              </div>
            ) : editing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full font-mono text-sm p-2 border border-border rounded resize-none"
                spellCheck={false}
              />
            ) : (
              <pre className="w-full h-full overflow-auto text-sm bg-muted p-4 rounded whitespace-pre-wrap">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileWorkspace;
