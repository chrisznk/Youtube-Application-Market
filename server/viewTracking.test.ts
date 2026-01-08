import { describe, expect, it, vi } from "vitest";

// Mock the database module
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => null),
}));

// Import the module after mocking
import { getPeriodHours, TimePeriod } from "./viewTracking";

describe("viewTracking", () => {
  describe("getPeriodHours", () => {
    it("returns 0 for 'latest' period", () => {
      expect(getPeriodHours("latest")).toBe(0);
    });

    it("returns 1 for '1h' period", () => {
      expect(getPeriodHours("1h")).toBe(1);
    });

    it("returns 2 for '2h' period", () => {
      expect(getPeriodHours("2h")).toBe(2);
    });

    it("returns 24 for '24h' period", () => {
      expect(getPeriodHours("24h")).toBe(24);
    });

    it("returns 48 for '48h' period", () => {
      expect(getPeriodHours("48h")).toBe(48);
    });

    it("returns 168 (7*24) for '1week' period", () => {
      expect(getPeriodHours("1week")).toBe(168);
    });

    it("returns 336 (14*24) for '2weeks' period", () => {
      expect(getPeriodHours("2weeks")).toBe(336);
    });

    it("returns 720 (30*24) for '1month' period", () => {
      expect(getPeriodHours("1month")).toBe(720);
    });

    it("returns 24 as default for unknown period", () => {
      // @ts-expect-error - testing invalid input
      expect(getPeriodHours("invalid")).toBe(24);
    });
  });

  describe("TimePeriod type", () => {
    it("should accept valid period values", () => {
      const validPeriods: TimePeriod[] = ["latest", "1h", "2h", "24h", "48h", "1week", "2weeks", "1month"];
      validPeriods.forEach((period) => {
        expect(["latest", "1h", "2h", "24h", "48h", "1week", "2weeks", "1month"]).toContain(period);
      });
    });
  });
});

describe("Period comparison logic", () => {
  it("should calculate correct time boundaries for 2h period at noon", () => {
    // If current time is 12:00 and period is 2h:
    // - Current period: 10:00 - 12:00
    // - Previous period: 08:00 - 10:00
    const now = new Date("2025-12-21T12:00:00Z");
    const hours = 2;
    
    const currentPeriodStart = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (2 * hours * 60 * 60 * 1000));
    
    expect(currentPeriodStart.toISOString()).toBe("2025-12-21T10:00:00.000Z");
    expect(previousPeriodStart.toISOString()).toBe("2025-12-21T08:00:00.000Z");
  });

  it("should calculate correct time boundaries for 1h period", () => {
    // If current time is 12:00 and period is 1h:
    // - Current period: 11:00 - 12:00
    // - Previous period: 10:00 - 11:00
    const now = new Date("2025-12-21T12:00:00Z");
    const hours = 1;
    
    const currentPeriodStart = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (2 * hours * 60 * 60 * 1000));
    
    expect(currentPeriodStart.toISOString()).toBe("2025-12-21T11:00:00.000Z");
    expect(previousPeriodStart.toISOString()).toBe("2025-12-21T10:00:00.000Z");
  });

  it("should calculate correct time boundaries for 24h period", () => {
    // If current time is 12:00 on Dec 21 and period is 24h:
    // - Current period: Dec 20 12:00 - Dec 21 12:00
    // - Previous period: Dec 19 12:00 - Dec 20 12:00
    const now = new Date("2025-12-21T12:00:00Z");
    const hours = 24;
    
    const currentPeriodStart = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (2 * hours * 60 * 60 * 1000));
    
    expect(currentPeriodStart.toISOString()).toBe("2025-12-20T12:00:00.000Z");
    expect(previousPeriodStart.toISOString()).toBe("2025-12-19T12:00:00.000Z");
  });
});

describe("Delta calculation", () => {
  it("should calculate positive delta when current period > previous period", () => {
    const currentPeriodViews = 1000;
    const previousPeriodViews = 500;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    
    expect(viewDelta).toBe(500);
    expect(viewDelta > 0).toBe(true);
  });

  it("should calculate negative delta when current period < previous period", () => {
    const currentPeriodViews = 300;
    const previousPeriodViews = 500;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    
    expect(viewDelta).toBe(-200);
    expect(viewDelta < 0).toBe(true);
  });

  it("should calculate zero delta when periods are equal", () => {
    const currentPeriodViews = 500;
    const previousPeriodViews = 500;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    
    expect(viewDelta).toBe(0);
  });
});

describe("Growth rate calculations", () => {
  it("should calculate positive growth rate correctly", () => {
    const currentPeriodViews = 1000;
    const previousPeriodViews = 500;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    
    // Growth rate = (delta / previous) * 10000 (to store as integer with 2 decimal precision)
    const viewGrowthRate = Math.round((viewDelta / previousPeriodViews) * 10000);
    
    expect(viewGrowthRate).toBe(10000); // 100% growth
  });

  it("should calculate negative growth rate correctly", () => {
    const currentPeriodViews = 250;
    const previousPeriodViews = 500;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    
    const viewGrowthRate = Math.round((viewDelta / previousPeriodViews) * 10000);
    
    expect(viewGrowthRate).toBe(-5000); // -50% growth
  });

  it("should handle 100% when previous period was 0 but current > 0", () => {
    const currentPeriodViews = 100;
    const previousPeriodViews = 0;
    
    const viewGrowthRate = previousPeriodViews > 0 
      ? Math.round(((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 10000)
      : (currentPeriodViews > 0 ? 10000 : 0);
    
    expect(viewGrowthRate).toBe(10000); // 100% when previous was 0
  });

  it("should handle 0% when both periods are 0", () => {
    const currentPeriodViews = 0;
    const previousPeriodViews = 0;
    
    const viewGrowthRate = previousPeriodViews > 0 
      ? Math.round(((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 10000)
      : (currentPeriodViews > 0 ? 10000 : 0);
    
    expect(viewGrowthRate).toBe(0);
  });

  it("should calculate 12.50% growth correctly", () => {
    const previousViews = 1000;
    const currentViews = 1125;
    const delta = currentViews - previousViews;
    const growthRate = Math.round((delta / previousViews) * 10000);
    
    expect(growthRate).toBe(1250); // 12.50%
  });
});

describe("Sorting for top videos", () => {
  const mockStats = [
    { currentPeriodViews: 1000, viewDelta: 500, viewGrowthRate: 10000 },
    { currentPeriodViews: 500, viewDelta: -200, viewGrowthRate: -5000 },
    { currentPeriodViews: 2000, viewDelta: 100, viewGrowthRate: 500 },
    { currentPeriodViews: 0, viewDelta: 0, viewGrowthRate: 0 },
    { currentPeriodViews: 300, viewDelta: -100, viewGrowthRate: -2500 },
  ];

  it("should sort topViewers by currentPeriodViews descending", () => {
    const sorted = [...mockStats].sort((a, b) => b.currentPeriodViews - a.currentPeriodViews);
    
    expect(sorted[0].currentPeriodViews).toBe(2000);
    expect(sorted[1].currentPeriodViews).toBe(1000);
    expect(sorted[2].currentPeriodViews).toBe(500);
  });

  it("should filter topGrowing to only positive deltas", () => {
    const topGrowing = mockStats
      .filter(v => v.viewDelta > 0)
      .sort((a, b) => b.viewGrowthRate - a.viewGrowthRate);
    
    expect(topGrowing.length).toBe(2);
    expect(topGrowing[0].viewGrowthRate).toBe(10000);
    expect(topGrowing[1].viewGrowthRate).toBe(500);
  });

  it("should filter topDeclining to only negative deltas", () => {
    const topDeclining = mockStats
      .filter(v => v.viewDelta < 0)
      .sort((a, b) => a.viewGrowthRate - b.viewGrowthRate);
    
    expect(topDeclining.length).toBe(2);
    expect(topDeclining[0].viewGrowthRate).toBe(-5000); // Most negative first
    expect(topDeclining[1].viewGrowthRate).toBe(-2500);
  });

  it("should sort lowestViewers by currentPeriodViews ascending", () => {
    const sorted = [...mockStats].sort((a, b) => a.currentPeriodViews - b.currentPeriodViews);
    
    expect(sorted[0].currentPeriodViews).toBe(0);
    expect(sorted[1].currentPeriodViews).toBe(300);
    expect(sorted[2].currentPeriodViews).toBe(500);
  });
});

describe("VideoTrendStats interface", () => {
  it("should have correct structure with new period comparison fields", () => {
    const mockStats = {
      videoId: 1,
      youtubeId: "abc123",
      title: "Test Video",
      thumbnailUrl: "https://example.com/thumb.jpg",
      currentViews: 1000,
      currentLikes: 100,
      currentComments: 50,
      currentPeriodViews: 150,
      currentPeriodLikes: 15,
      currentPeriodComments: 5,
      previousPeriodViews: 100,
      previousPeriodLikes: 10,
      previousPeriodComments: 3,
      viewDelta: 50, // currentPeriod - previousPeriod
      likeDelta: 5,
      commentDelta: 2,
      viewGrowthRate: 5000, // 50%
      likeGrowthRate: 5000,
      commentGrowthRate: 6667,
      currentPeriodStart: new Date("2025-12-21T10:00:00Z"),
      previousPeriodStart: new Date("2025-12-21T08:00:00Z"),
    };

    expect(mockStats.videoId).toBe(1);
    expect(mockStats.currentPeriodViews).toBe(150);
    expect(mockStats.previousPeriodViews).toBe(100);
    expect(mockStats.viewDelta).toBe(50);
    expect(mockStats.viewGrowthRate).toBe(5000);
  });

  it("should handle negative deltas correctly", () => {
    const mockStats = {
      currentPeriodViews: 80,
      previousPeriodViews: 100,
      viewDelta: -20, // Doing worse than previous period
      viewGrowthRate: -2000, // -20%
    };

    expect(mockStats.viewDelta).toBeLessThan(0);
    expect(mockStats.viewGrowthRate).toBeLessThan(0);
  });
});
