import { Prisma } from "@prisma/client";

function getModel(name: string) {
  const model = Prisma.dmmf.datamodel.models.find((item) => item.name === name);

  expect(model).toBeDefined();
  return model!;
}

describe("community prisma model", () => {
  it("adds vote counters to Skill", () => {
    const skill = getModel("Skill");
    const fieldNames = skill.fields.map((field) => field.name);

    expect(fieldNames).toContain("totalUpvoteCount");
    expect(fieldNames).toContain("totalDownvoteCount");
  });

  it("defines SkillComment with required core fields", () => {
    const comment = getModel("SkillComment");
    const skillIdField = comment.fields.find((field) => field.name === "skillId");
    const authorNameField = comment.fields.find((field) => field.name === "authorName");
    const contentField = comment.fields.find((field) => field.name === "content");

    expect(skillIdField?.isRequired).toBe(true);
    expect(authorNameField?.isRequired).toBe(true);
    expect(contentField?.isRequired).toBe(true);
  });

  it("defines SkillVote value enum and unique browser-skill constraint", () => {
    const vote = getModel("SkillVote");
    const valueField = vote.fields.find((field) => field.name === "value");
    const uniqueFields = vote.uniqueFields;
    const uniqueIndexes = vote.uniqueIndexes.map((index) => index.fields);
    const hasCompositeUnique =
      uniqueFields.some((fields) => fields.join(",") === "skillId,browserTokenHash") ||
      uniqueIndexes.some((fields) => fields.join(",") === "skillId,browserTokenHash");

    expect(valueField?.type).toBe("SkillVoteValue");
    expect(hasCompositeUnique).toBe(true);

    const voteEnum = Prisma.dmmf.datamodel.enums.find((item) => item.name === "SkillVoteValue");
    const enumValues = voteEnum?.values.map((value) => value.name);
    expect(enumValues).toEqual(["up", "down"]);
  });
});
