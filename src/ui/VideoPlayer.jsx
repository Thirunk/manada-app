import StatePanel from "./StatePanel";

/**
 * Accessible video player. It uses native controls, loads nothing until the
 * viewer presses play (preload="none"), and never autoplays. Captions and a
 * text transcript are offered when they are supplied.
 *
 * No video file is bundled. Without `src` the component shows an honest
 * "pending" state instead of a placeholder video.
 */
function VideoPlayer({ title, src, poster, captions, transcript }) {
  if (!src || !captions) {
    return (
      <StatePanel variant="info" title="Demonstration video pending">
        {src
          ? "This video cannot be shown until a captions file is provided."
          : `The demonstration video for ${title} will appear here once Manada supplies the video file and its captions.`}
      </StatePanel>
    );
  }

  return (
    <figure className="space-y-4">
      <video
        controls
        preload="none"
        poster={poster}
        playsInline
        aria-label={title}
        className="aspect-video w-full rounded-lg bg-navy"
      >
        <source src={src} type="video/mp4" />
        <track
          kind="captions"
          src={captions}
          srcLang="en"
          label="English"
          default
        />
        Your browser cannot play this video. Use the transcript below.
      </video>
      {transcript ? (
        <details className="rounded-md border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-navy">
            Show transcript
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-body">
            {transcript}
          </p>
        </details>
      ) : null}
    </figure>
  );
}

export default VideoPlayer;
