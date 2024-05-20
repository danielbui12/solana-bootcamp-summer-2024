"use client";

import { Button, Checkbox, ListItem } from "@chakra-ui/react";

export default function TodoItem({
  content,
  onToggle,
  onDelete,
  completed = false,
}: {
  content: string;
  onToggle: () => void,
  onDelete: () => void,
  completed?: boolean;
}) {
  return (
    <ListItem borderBottomColor="gray.500" borderBottomWidth="1px" py={4}>
      <Checkbox
        isChecked={completed}
        sx={{
          textDecoration: completed ? "line-through" : "initial",
        }}
        onChange={() => {
          onToggle()
        }}
      >
        {content}

        <Button color="orange" onClick={onDelete}>Delete</Button>
      </Checkbox>
    </ListItem>
  );
}
