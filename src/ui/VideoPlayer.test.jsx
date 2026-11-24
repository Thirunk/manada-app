import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import VideoPlayer from "./VideoPlayer";

describe("video player", () => {
  it("shows an honest pending state and no video element when no file is supplied", () => {
    const { container } = render(
      <VideoPlayer title="Machine demonstration" src={null} />,
    );
    expect(screen.getByText("Demonstration video pending")).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
  });

  it("requires captions before a video is shown", () => {
    const { container } = render(
      <VideoPlayer title="Machine demonstration" src="/video/demo.mp4" />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText(/captions file is provided/)).toBeInTheDocument();
  });

  it("uses native controls, loads nothing until play, never autoplays, and has captions", () => {
    const { container } = render(
      <VideoPlayer
        title="Machine demonstration"
        src="/video/demo.mp4"
        captions="/video/demo.vtt"
        transcript="Spoken words of the demonstration."
      />,
    );
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video.querySelector("track")).toHaveAttribute("kind", "captions");
    expect(screen.getByText("Show transcript")).toBeInTheDocument();
  });
});
