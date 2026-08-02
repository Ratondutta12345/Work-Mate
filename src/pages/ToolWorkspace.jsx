import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getToolBySlug } from '../data/tools'
import { runTool } from '../services/authApi'

function ToolWorkspace() {
  const { slug } = useParams()
  const tool = getToolBySlug(slug)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [error, setError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState(tool?.defaultFilter || '')
  const [selectedFileType, setSelectedFileType] = useState(tool?.defaultFileType || '')
  const [selectedFiles, setSelectedFiles] = useState([])

  useEffect(() => {
    setInput('')
    setOutput('')
    setBusy(false)
    setActionNote('')
    setError('')
    setSelectedFilter(tool?.defaultFilter || '')
    setSelectedFileType(tool?.defaultFileType || '')
    setSelectedFiles([])
  }, [tool])

  if (!tool) {
    return <Navigate to="/get-started" replace />
  }

  const isCopyTool = tool.resultAction === 'copy'
  const needsFileUpload = Array.isArray(tool.allowedFileTypes) && tool.allowedFileTypes.length > 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    const hasText = input.trim().length > 0
    const hasFiles = selectedFiles.length > 0
    if (!hasText && !hasFiles) return

    setBusy(true)
    setOutput('')
    setActionNote('')
    setError('')

    try {
      const options = {
        filter: selectedFilter,
        imageType: selectedFilter,
        fileType: selectedFileType,
        files: selectedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl,
        })),
      }

      const data = await runTool(tool.slug, input.trim(), options)
      setOutput(data.run.output)
    } catch (err) {
      setError(err.message || 'Failed to run tool.')
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setActionNote('Copied to clipboard')
    } catch {
      setActionNote('Could not copy. Please select and copy manually.')
    }
  }

  const handleDownload = async () => {
    if (!output) return

    if (/^data:image\//i.test(output.trim())) {
      const response = await fetch(output)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workmate-${tool.slug}-result.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setActionNote('Image download started')
      return
    }

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workmate-${tool.slug}-result.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setActionNote('Download started')
  }

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    const processed = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: typeof reader.result === 'string' ? reader.result : '',
              })
            }
            reader.onerror = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: '',
              })
            }
            reader.readAsDataURL(file)
          }),
      ),
    )
    setSelectedFiles(processed)
  }

  return (
    <div className="workspace-panel">
      <header className="workspace-panel-header">
        <p className="workspace-eyebrow">
          <span aria-hidden="true">{tool.icon}</span> AI Tool
        </p>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
      </header>

      <div className="tool-workspace-grid">
        <form className="tool-form" onSubmit={handleSubmit}>
          {tool.filterOptions?.length ? (
            <div className="tool-options-block">
              <label>{tool.filterLabel}</label>
              <div className="filter-chip-group">
                {tool.filterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`filter-chip ${selectedFilter === option ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {needsFileUpload ? (
            <div className="tool-upload-block">
              <label htmlFor="tool-file-type">File type</label>
              <select
                id="tool-file-type"
                value={selectedFileType}
                onChange={(event) => setSelectedFileType(event.target.value)}
              >
                {tool.allowedFileTypes.map((fileType) => (
                  <option key={fileType} value={fileType}>
                    {fileType}
                  </option>
                ))}
              </select>

              <label htmlFor="tool-files" className="upload-field-label">
                Add PDF, JPEG, PNG, or image files
              </label>
              <input
                id="tool-files"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                multiple
                onChange={handleFiles}
              />

              {selectedFiles.length ? (
                <ul className="selected-file-list">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <label htmlFor="tool-input">{tool.hint}</label>
          <textarea
            id="tool-input"
            rows={8}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Try ${tool.title}…`}
          />
          {error ? <p className="tool-action-note error-note">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Working…' : `Run ${tool.title}`}
          </button>
        </form>

        <section className="tool-output" aria-live="polite">
          <div className="tool-output-head">
            <h2>AI Answer</h2>
            {output ? (
              isCopyTool ? (
                <button type="button" className="tool-action-btn" onClick={handleCopy}>
                  Copy
                </button>
              ) : (
                <button type="button" className="tool-action-btn" onClick={handleDownload}>
                  Download
                </button>
              )
            ) : null}
          </div>

          {output ? (
            /^data:image\//i.test(output.trim()) ? (
              <img src={output} alt={tool.title} style={{ maxWidth: '100%', borderRadius: 12 }} />
            ) : (
              <pre>{output}</pre>
            )
          ) : (
            <div className="tool-output-placeholder">
              <p>Describe the article topic, tone, audience, and points you want covered. Your AI answer will appear here once the tool runs.</p>
            </div>
          )}

          {actionNote ? <p className="tool-action-note">{actionNote}</p> : null}
        </section>
      </div>
    </div>
  )
}

export default ToolWorkspace
