import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MEDIA_FIXTURES, MEDIA_KINDS, MEDIA_STATUSES } from "../config/media";
import StatePanel from "./StatePanel";
import StatusBadge from "./StatusBadge";

const KIND_LABELS = { image: "Image", video: "Video", brochure: "Brochure" };
const BUTTON =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-navy disabled:cursor-not-allowed disabled:opacity-50";

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Media library for the design preview. It supports search, filters, ordering
 * with buttons (the keyboard alternative to drag and drop), cover selection and
 * approval status.
 *
 * Uploads are NOT stored. Selected files are listed on this page only, with a
 * local preview, and are marked "not uploaded" until storage is connected (M4).
 */
function MediaLibrary() {
  const [items, setItems] = useState(() =>
    MEDIA_FIXTURES.map((item) => ({ ...item, cover: false })),
  );
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [queue, setQueue] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const previewUrls = useRef(new Set());
  const uid = useId();
  const instructionsId = `${uid}-instructions`;

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!kind || item.kind === kind) &&
          (!status || item.status === status) &&
          (!query.trim() ||
            item.title.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [items, kind, status, query],
  );

  // Release every preview URL when the page unmounts.
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const releasePreview = (entry) => {
    if (entry.previewUrl) {
      URL.revokeObjectURL(entry.previewUrl);
      previewUrls.current.delete(entry.previewUrl);
    }
  };

  const addFiles = (fileList) => {
    const entries = Array.from(fileList).map((file, index) => {
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
      if (previewUrl) previewUrls.current.add(previewUrl);
      return {
        key: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
        previewUrl,
      };
    });
    setQueue((current) => [...current, ...entries]);
  };

  const move = (id, direction) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const setCover = (id) => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        cover: item.kind === "image" && item.id === id,
      })),
    );
  };

  const setItemStatus = (id, nextStatus) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item,
      ),
    );
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby={`${uid}-upload`} className="card p-6">
        <h2
          id={`${uid}-upload`}
          className="font-display text-xl font-bold text-navy"
        >
          Upload media
        </h2>
        <p id={instructionsId} className="mt-2 text-sm text-body">
          Drop files here, or choose files with the button. Images, videos and
          PDF brochures are accepted. Files are shown on this page only and are
          not stored yet.
        </p>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`mt-4 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center ${
            dragging ? "border-teal bg-teal/5" : "border-slate-300 bg-canvas"
          }`}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-secondary"
            aria-describedby={instructionsId}
          >
            Choose files
          </button>
          <p className="text-sm text-muted">or drag files into this area</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose files to add"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {queue.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No files selected.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {queue.map((entry) => (
              <li key={entry.key} className="flex items-center gap-4 p-3">
                {entry.previewUrl ? (
                  <img
                    src={entry.previewUrl}
                    alt=""
                    width="48"
                    height="48"
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div
                    className="h-12 w-12 flex-none rounded bg-canvas"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">
                    {entry.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatSize(entry.size)} · Not uploaded. Storage is not
                    connected yet (M4).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    releasePreview(entry);
                    setQueue((current) =>
                      current.filter((item) => item.key !== entry.key),
                    );
                  }}
                  className={BUTTON}
                >
                  Remove {entry.name} from list
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`${uid}-library`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id={`${uid}-library`}
              className="font-display text-xl font-bold text-navy"
            >
              Media library
            </h2>
            <p className="text-sm text-body">
              Order, cover image and approval are sample changes on this page
              only.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
            <div>
              <label
                htmlFor={`${uid}-search`}
                className="text-xs font-semibold text-navy"
              >
                Search media
              </label>
              <input
                id={`${uid}-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label
                htmlFor={`${uid}-kind`}
                className="text-xs font-semibold text-navy"
              >
                Type
              </label>
              <select
                id={`${uid}-kind`}
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="field-input mt-1"
              >
                <option value="">All types</option>
                {MEDIA_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {KIND_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`${uid}-status`}
                className="text-xs font-semibold text-navy"
              >
                Approval
              </label>
              <select
                id={`${uid}-status`}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="field-input mt-1"
              >
                <option value="">All states</option>
                {MEDIA_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {visible.length === 0 ? (
            <StatePanel variant="empty" title="No media match these filters">
              Clear the search or choose &ldquo;All types&rdquo; and &ldquo;All
              states&rdquo;.
            </StatePanel>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => {
                const absoluteIndex = items.findIndex(
                  (candidate) => candidate.id === item.id,
                );
                return (
                  <li
                    key={item.id}
                    className="card flex flex-col overflow-hidden"
                  >
                    <div className="flex aspect-[4/3] items-center justify-center bg-canvas">
                      {item.thumb ? (
                        <img
                          src={item.thumb}
                          alt=""
                          width="240"
                          height="180"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted">
                          {KIND_LABELS[item.kind]} · no file yet
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-slate-100 text-body">
                          {KIND_LABELS[item.kind]}
                        </span>
                        <StatusBadge status={item.status} />
                        {item.cover ? (
                          <span className="badge bg-teal/10 text-teal">
                            Cover image
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-semibold text-navy">{item.title}</h3>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => move(item.id, -1)}
                          disabled={absoluteIndex === 0}
                          aria-label={`Move ${item.title} earlier`}
                          className={BUTTON}
                        >
                          Move earlier
                        </button>
                        <button
                          type="button"
                          onClick={() => move(item.id, 1)}
                          disabled={absoluteIndex === items.length - 1}
                          aria-label={`Move ${item.title} later`}
                          className={BUTTON}
                        >
                          Move later
                        </button>
                        {item.kind === "image" ? (
                          <button
                            type="button"
                            onClick={() => setCover(item.id)}
                            aria-pressed={item.cover}
                            className={BUTTON}
                          >
                            Set as cover
                          </button>
                        ) : null}
                      </div>
                      <div>
                        <label
                          htmlFor={`${uid}-state-${item.id}`}
                          className="text-xs font-semibold text-navy"
                        >
                          Approval for {item.title}
                        </label>
                        <select
                          id={`${uid}-state-${item.id}`}
                          value={item.status}
                          onChange={(event) =>
                            setItemStatus(item.id, event.target.value)
                          }
                          className="field-input mt-1 py-1.5"
                        >
                          {MEDIA_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option[0].toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default MediaLibrary;
