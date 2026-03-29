import { resolveSkillVoteTransition } from "@/lib/skills/community";

describe("community vote transitions", () => {
  it("adds an upvote from a neutral state", () => {
    expect(resolveSkillVoteTransition(null, "up")).toEqual({
      nextValue: "up",
      upvoteDelta: 1,
      downvoteDelta: 0
    });
  });

  it("removes an upvote when the same direction is clicked again", () => {
    expect(resolveSkillVoteTransition("up", "up")).toEqual({
      nextValue: null,
      upvoteDelta: -1,
      downvoteDelta: 0
    });
  });

  it("switches from upvote to downvote while keeping counters in sync", () => {
    expect(resolveSkillVoteTransition("up", "down")).toEqual({
      nextValue: "down",
      upvoteDelta: -1,
      downvoteDelta: 1
    });
  });

  it("removes a downvote when the same direction is clicked again", () => {
    expect(resolveSkillVoteTransition("down", "down")).toEqual({
      nextValue: null,
      upvoteDelta: 0,
      downvoteDelta: -1
    });
  });
});
