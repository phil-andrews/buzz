import assert from "node:assert/strict";
import test from "node:test";

import { addProjectChannel } from "./useAddProjectChannel.ts";

const OWNER = "a".repeat(64);

function makeProject(overrides = {}) {
  return {
    id: `30621:${OWNER}:platform`,
    dtag: "platform",
    name: "Platform",
    description: "",
    owner: OWNER,
    createdAt: 100,
    projectChannelId: "11111111-1111-4111-8111-111111111111",
    relatedChannelIds: [],
    status: "active",
    projectAddress: `30621:${OWNER}:platform`,
    primaryRepositoryAddress: null,
    repositoryAddresses: [],
    repositories: [],
    legacy: false,
    ...overrides,
  };
}

function makeLiveHead(createdAt) {
  return {
    id: "f".repeat(64),
    kind: 30621,
    pubkey: OWNER,
    created_at: createdAt,
    content: "",
    tags: [["d", "platform"]],
    sig: "0".repeat(128),
  };
}

function input() {
  return {
    name: "Engineering",
    project: makeProject(),
    visibility: "private",
  };
}

function dependencies(fetchEvents) {
  let createCalls = 0;
  return {
    deps: {
      applyAgents: async () => {},
      applyCanvas: async () => {},
      createChannel: async () => {
        createCalls += 1;
        throw new Error(
          "createChannel must not run before live-head preflight",
        );
      },
      fetchEvents,
    },
    createCalls: () => createCalls,
  };
}

test("addProjectChannel does not create a channel when the live project head is stale", async () => {
  const harness = dependencies(async () => [makeLiveHead(101)]);

  await assert.rejects(
    addProjectChannel(input(), harness.deps),
    /updated by another session/,
  );
  assert.equal(harness.createCalls(), 0);
});

test("addProjectChannel does not create a channel when the live project head is missing", async () => {
  const harness = dependencies(async () => []);

  await assert.rejects(
    addProjectChannel(input(), harness.deps),
    /Could not find this project on the relay/,
  );
  assert.equal(harness.createCalls(), 0);
});
