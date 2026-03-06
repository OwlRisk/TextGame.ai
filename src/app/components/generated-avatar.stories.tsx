import type { Meta, StoryObj } from "@storybook/react";
import { GeneratedAvatar } from "./generated-avatar";

const meta: Meta<typeof GeneratedAvatar> = {
  title: "Components/GeneratedAvatar",
  component: GeneratedAvatar,
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["gm", "host", "player"] },
    name: { control: "text" },
    fallbackColor: { control: "color" },
    enabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-4 p-8 bg-zinc-900">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GeneratedAvatar>;

export const GameMaster: Story = {
  args: {
    name: "Game Master",
    type: "gm",
    enabled: false,
    className: "h-10 w-10",
  },
};

export const AIPlayer: Story = {
  args: {
    name: "Luna",
    type: "player",
    fallbackColor: "#8b5cf6",
    enabled: false,
    className: "h-10 w-10",
  },
};

export const Host: Story = {
  args: {
    name: "Echo",
    type: "host",
    fallbackColor: "#6366f1",
    enabled: false,
    className: "h-10 w-10",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <GeneratedAvatar name="S" type="player" enabled={false} fallbackColor="#ef4444" className="h-6 w-6" />
      <GeneratedAvatar name="M" type="player" enabled={false} fallbackColor="#f59e0b" className="h-8 w-8" />
      <GeneratedAvatar name="L" type="player" enabled={false} fallbackColor="#22c55e" className="h-10 w-10" />
      <GeneratedAvatar name="XL" type="player" enabled={false} fallbackColor="#3b82f6" className="h-14 w-14" />
    </div>
  ),
};
