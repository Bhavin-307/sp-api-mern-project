import { useEffect, useState } from "react";
import { downloadResult, getStatus, uploadCsv } from "./api";

const App = () => {
  const [file, setFile] = useState(null);
  const [feedId, setFeedId] = useState("");
  const [status, setStatus] = useState("");
  const [polling, setPolling] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setFeedId("");
    setStatus("uploading...");
    const resp = await uploadCsv(file);
    setFeedId(resp.feedId);
    setStatus(resp.status || "In_QUEUE");
    setPolling(true);
  }

  useEffect(() => {
    if (!polling || !feedId) return;
    const t = setInterval(async () => {
      const s = await getStatus(feedId);
      setStatus(s.status);
      if (
        s.status === "DONE" ||
        s.status === "FATAL" ||
        s.status === "CANCELLED"
      ) {
        setPolling(false);
        clearInterval(t);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [polling, feedId]);

  async function onDownload() {
    const blob = await downloadResult(feedId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feed-${feedId}-result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "3rem auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2>Amazon Title Update (CSV → XML Feed)</h2>
      <form onSubmit={onSubmit}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={!file} style={{ marginLeft: 12 }}>
          Submit
        </button>
      </form>
      {feedId && (
        <div style={{ marginTop: 20 }}>
          <div>
            <strong>feedId:</strong> {feedId}
          </div>
          <div>
            <strong>Status:</strong> {status}
          </div>

          {status === "DONE" && (
            <button onClick={onDownload} style={{ marginTop: 10 }}>
              Download Processing Report
            </button>
          )}
        </div>
      )}
      <p style={{ marginTop: 40, fontSize: 12, opacity: 0.75 }}>
        CSV columns required: <code>sku, title</code>
      </p>
    </div>
  );
};

export default App;
