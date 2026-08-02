function WorkspaceHome() {
  return (
    <div className="workspace-panel welcome-panel">
      <header className="workspace-panel-header">
        <p className="workspace-eyebrow">Your AI workspace</p>
        <h1>Ready when you are</h1>
        <p>
          Pick any tool from the left menu and start creating. Write faster,
          polish visuals, and ship better content — all in one place.
        </p>
      </header>

      <div className="welcome-stats">
        <div>
          <strong>6</strong>
          <span>AI tools ready</span>
        </div>
        <div>
          <strong>Fast</strong>
          <span>Drafts in seconds</span>
        </div>
        <div>
          <strong>Simple</strong>
          <span>One click to start</span>
        </div>
      </div>

      <section className="welcome-steps">
        <h2>How it works</h2>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Select a tool</strong>
              <p>Use the left sidebar to open writing, image, or resume tools.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Add your input</strong>
              <p>Describe what you need, paste text, or upload an image.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Copy or download</strong>
              <p>Save text results with Copy, or Download image and file outputs.</p>
            </div>
          </li>
        </ol>
      </section>

      <aside className="welcome-tip">
        <strong>Tip</strong>
        <p>
          Start with Article Writer or Blog Title Generator for text, then move
          to image tools when you need visuals.
        </p>
      </aside>
    </div>
  )
}

export default WorkspaceHome
