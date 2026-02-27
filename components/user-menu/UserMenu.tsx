"use client";

import React from "react";
import classNames from "classnames";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import styles from "./UserMenu.module.scss";
import { MoreHorizontal } from "lucide-react";

export interface UserMenuProps {
  name?: string;
  email?: string;
  avatar?: string;
  initials?: string;
  selected?: boolean;
  onSignOut?: () => void;
  onSettings?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const UserMenu: React.FC<UserMenuProps> = ({
  name = "User",
  email,
  avatar,
  initials = "U",
  selected = false,
  onSignOut,
  onSettings,
  className,
  style,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          className="border-none shadow-none focus:ring-0 px-0 py-0 h-auto text-sm whitespace-nowrap flex items-center gap-2 text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
          style={style}
        >
          <Avatar className="w-6 h-6">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="bg-[#E91E63] text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{name}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 rounded-[16px]" onClick={(e) => e.stopPropagation()}>
        {name && (
          <>
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">{name}</span>
              {email && <span className="text-xs text-gray-500">{email}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {onSettings && (
          <>
            <DropdownMenuItem onClick={onSettings}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {onSignOut && (
          <DropdownMenuItem onClick={onSignOut} className="text-red-600 dark:text-red-400">
            Sign Out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

UserMenu.displayName = "UserMenu";
export { UserMenu };
