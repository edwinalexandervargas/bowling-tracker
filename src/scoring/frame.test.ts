import { describe, it, expect } from 'vitest'
import { isFrameComplete } from './frame'

describe('isFrameComplete', () => {
  it('a strike completes frames 1-9', () => {
    // a strike means one shot where pinsAfter is 0
    const shots = [{ pinsBefore: 1023, pinsAfter: 0 }]
    expect(isFrameComplete(shots, 0)).toBe(true)
  })
})

it("two shots complete frames 1-9", () => {
  const shots = [
    { pinsBefore: 1023, pinsAfter: 576 },
    { pinsBefore: 576, pinsAfter: 512 },
  ];
  expect(isFrameComplete(shots, 0)).toBe(true);
});

it("a strike does not complete the 10th frame", () => {
  const shots = [{ pinsBefore: 1023, pinsAfter: 0 }];
  expect(isFrameComplete(shots, 9)).toBe(false);
});

it('an open frame completes the 10th', () => {
  const shots = [
    { pinsBefore: 1023, pinsAfter: 576 },
    { pinsBefore: 576, pinsAfter: 512 },
  ]
  expect(isFrameComplete(shots, 9)).toBe(true)
})

it('three strikes complete the 10th frame', () => {
  const shots = [
    { pinsBefore: 1023, pinsAfter: 0 },
    { pinsBefore: 1023, pinsAfter: 0 },
    { pinsBefore: 1023, pinsAfter: 0 },
  ]
  expect(isFrameComplete(shots, 9)).toBe(true)
})

it('a spare with a bonus shot completes the 10th', () => {
  const shots = [
    { pinsBefore: 1023, pinsAfter: 576 },   // left 7 and 10
    { pinsBefore: 576, pinsAfter: 0 },       // spare, cleared them
    { pinsBefore: 1023, pinsAfter: 512 },    // bonus ball, fresh rack
  ]
  expect(isFrameComplete(shots, 9)).toBe(true)
})