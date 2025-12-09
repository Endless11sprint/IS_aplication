// src/components/Header/header.types.ts
 import { type SvgIconComponent } from "@mui/icons-material"; 
// Базовая информация, которую храним о каждой из навигационных вкладок
 export interface NavItem { 
  id: string; 
  label: string; 
  icon?: SvgIconComponent; 
  href?: string; 
} 
// Превью аватарки пользователя
 export interface UserBrief { 
  name: string; 
  avatarUrl?: string; 
} 