import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import CommentThread, { type CommentData } from "./CommentThread";

function Wrap({ children }: { children: React.ReactNode }) {
  return <Router>{children}</Router>;
}

describe("CommentThread", () => {
  it("shows 'Sign in' placeholder when no currentUser", () => {
    render(
      <Wrap>
        <CommentThread
          comments={[]}
          currentUser={null}
          onPost={vi.fn()}
          onReply={vi.fn()}
        />
      </Wrap>
    );
    expect(
      screen.getByPlaceholderText("Sign in to weigh in...")
    ).toBeInTheDocument();
  });

  it("disables the input when no currentUser", () => {
    render(
      <Wrap>
        <CommentThread
          comments={[]}
          currentUser={null}
          onPost={vi.fn()}
          onReply={vi.fn()}
        />
      </Wrap>
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("shows empty state message when no comments", () => {
    render(
      <Wrap>
        <CommentThread
          comments={[]}
          currentUser={null}
          onPost={vi.fn()}
          onReply={vi.fn()}
        />
      </Wrap>
    );
    expect(
      screen.getByText(/No takes yet — drop the first one/i)
    ).toBeInTheDocument();
  });

  it("renders provided comments in the list", () => {
    const comments: CommentData[] = [
      {
        id: 1,
        body: "Awesome project!",
        createdAt: new Date().toISOString(),
        user: { username: "alice" },
        replies: [],
      },
    ];
    render(
      <Wrap>
        <CommentThread
          comments={comments}
          currentUser={null}
          onPost={vi.fn()}
          onReply={vi.fn()}
        />
      </Wrap>
    );
    expect(screen.getByText("Awesome project!")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("calls onPost when logged-in user submits a comment", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn().mockResolvedValue(undefined);
    const currentUser = { username: "bob", avatarUrl: null };

    render(
      <Wrap>
        <CommentThread
          comments={[]}
          currentUser={currentUser}
          onPost={onPost}
          onReply={vi.fn()}
        />
      </Wrap>
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "This is my take");
    await user.keyboard("{Enter}");

    expect(onPost).toHaveBeenCalledWith("This is my take");
  });
});
