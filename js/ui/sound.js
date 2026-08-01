const sounds = {
  move:    new Audio("sounds/move.mp3"),
  capture: new Audio("sounds/capture.mp3"),
  check:   new Audio("sounds/check.mp3"),
  end:     new Audio("sounds/end.mp3"),
};

Object.values(sounds).forEach((a) => { a.preload = "auto"; });

const play = (name) => {
  const audio = sounds[name];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const playMove    = () => play("move");
export const playCapture = () => play("capture");
export const playCheck   = () => play("check");
export const playEnd     = () => play("end");
