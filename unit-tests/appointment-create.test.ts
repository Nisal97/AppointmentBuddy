/**
 * @fileoverview appointment-create.test.ts — Unit tests for createAppointment.
 * Covers the new-appointment form action: validation, auth, profile self-heal,
 * service/assignee resolution, insert + link, rollback, and redirect.
 * TO RUN: npm run test:unit -- appointment-create
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAppointment, type AppointmentState } from "@/app/(app)/appointments/actions";
import { baseValidFields, buildFormData, buildMockChain, VALID_SERVICE } from "./appointment-test-helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`);
    (error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

const mockAuth = { getUser: vi.fn() };
const mockFrom = vi.fn();
const mockSupabase = { auth: mockAuth, from: mockFrom } as unknown as Awaited<
  ReturnType<typeof createClient>
>;
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn(async () => mockSupabase) }));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
const mockedCreateClient = vi.mocked(createClient);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedRedirect = vi.mocked(redirect);
const mockedFrom = vi.mocked(mockFrom);
const mockedGetUser = vi.mocked(mockAuth.getUser);

describe("createAppointment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns error when user is not signed in", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields }));
    expect(result.error).toBe("You must be signed in to create appointments.");
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("returns error when contact number is missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields, contactNumber: "" }));
    expect(result.error).toBe("Contact number is required.");
  });

  it("returns error when appointment date is invalid", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields, appointmentDate: "not-a-date" }));
    expect(result.error).toBe("Please choose a valid appointment date.");
  });

  it("returns error when no services are selected", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields, serviceIds: JSON.stringify([]) }));
    expect(result.error).toBe("Please select at least one service.");
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("returns error when serviceIds JSON is malformed", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    // Two values for the same key: formData.get() returns the first, so the
    // valid JSON wins and the malformed append is ignored — the action proceeds
    // to the profile self-heal. This locks in native FormData.get() semantics.
    const fd = buildFormData({ ...baseValidFields });
    fd.append("serviceIds", "not-json");
    mockedFrom.mockImplementation(() => buildMockChain({ error: { message: "profile failed" } }));
    const result = await createAppointment({} as AppointmentState, fd);
    expect(result.error).toBe("profile failed");
  });

  it("returns profile upsert error without inserting appointment", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ error: { message: "profile failed" } }));
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields }));
    expect(result.error).toBe("profile failed");
    expect(mockedFrom).toHaveBeenCalledWith("profiles");
  });

  it("returns error when one or more services are invalid", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      return buildMockChain({ data: [] });
    });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields }));
    expect(result.error).toBe("One or more selected services are invalid.");
  });

  it("returns error when assignee is invalid", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      if (table === "services") return buildMockChain({ data: [VALID_SERVICE] });
      if (table === "assignees") return buildMockChain({ singleData: null });
      return buildMockChain({});
    });
    const result = await createAppointment(
      {} as AppointmentState,
      buildFormData({ ...baseValidFields, assigneeId: "bad-assignee" }),
    );
    expect(result.error).toBe("Selected assignee is invalid.");
  });

  it("returns error when appointment insert fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      if (table === "services") return buildMockChain({ data: [VALID_SERVICE] });
      if (table === "appointments") {
        return buildMockChain({ singleData: null, singleError: { message: "insert failed" } });
      }
      return buildMockChain({});
    });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields }));
    expect(result.error).toBe("insert failed");
  });

  it("redirects to /home?created=1 on success", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      if (table === "services") return buildMockChain({ data: [VALID_SERVICE] });
      if (table === "appointments") {
        return buildMockChain({ singleData: { id: "appt-1" }, singleError: null });
      }
      if (table === "appointment_services") return buildMockChain({ error: null });
      return buildMockChain({});
    });
    await expect(
      createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields })),
    ).rejects.toThrow("NEXT_REDIRECT: /home?created=1");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/home", "layout");
    expect(mockedRedirect).toHaveBeenCalledWith("/home?created=1");
  });

  it("rolls back appointment if service link fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const maleService = {
      id: "svc-1", duration_minutes: 30, cost: 2500, gender_specific: true,
      male_duration_minutes: 20, male_cost: 2000,
      female_duration_minutes: 40, female_cost: 3000,
    };
    let deleteCalled = false;
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      if (table === "services") return buildMockChain({ data: [maleService] });
      if (table === "appointments") {
        const chain = buildMockChain({ singleData: { id: "appt-1" }, singleError: null });
        const originalDelete = chain.delete;
        chain.delete = (...args: unknown[]) => { deleteCalled = true; return originalDelete(...args); };
        return chain;
      }
      if (table === "appointment_services") return buildMockChain({ error: { message: "link failed" } });
      return buildMockChain({});
    });
    await expect(
      createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields })),
    ).resolves.toEqual({ error: "link failed" });
    expect(deleteCalled).toBe(true);
  });

  it("returns services error message when services query fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation((table: string) => {
      if (table === "profiles") return buildMockChain({ error: null });
      return buildMockChain({ error: { message: "services failed" } });
    });
    const result = await createAppointment({} as AppointmentState, buildFormData({ ...baseValidFields }));
    expect(result.error).toBe("services failed");
  });
});
