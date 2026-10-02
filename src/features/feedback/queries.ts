import { useMutation } from "@tanstack/react-query";
import { feedbackApi } from "./api";
import type { FeedbackSubmission } from "./types";

export function useSubmitFeedback() {
  return useMutation({ mutationFn: (submission: FeedbackSubmission) => feedbackApi.submit(submission) });
}
