import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Send, Plus, Trash2 } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Link: Story = {
  args: { variant: "link", children: "Link" },
};

export const Small: Story = {
  args: { size: "sm", children: "Small" },
};

export const Large: Story = {
  args: { size: "lg", children: "Large" },
};

export const WithIcon: Story = {
  args: { children: <><Send /> Send Message</> },
};

export const IconOnly: Story = {
  args: { size: "icon", children: <Plus />, "aria-label": "Add" },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>Default</Button>
      <Button variant="destructive"><Trash2 /> Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
