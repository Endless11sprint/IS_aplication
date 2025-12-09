// src/components/Button/Button.tsx
import { type ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import s from "./Button.module.css";

/**
 * Допустимые значения визуального варианта кнопки.
 * Здесь используется операция объединения(union -
 * https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html)
 */
type ButtonVariant = "primary" | "secondary";

/** Допустимые размеры кнопки. */
type ButtonSize = "sm" | "md" | "lg";

// Базовые нативные пропсы кнопки (type, autoFocus, aria-*, и т.д.)
type NativeButtonProps = ComponentPropsWithoutRef<"button">;

interface ButtonProps extends NativeButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    // className, disabled и children уже есть в NativeButtonProps, дублировать не обязательно
}

/**
 * Универсальная кнопка.
 * При помощи знака `=` сразу указываем значения "по умолчанию" для части параметров
 */
export function Button({
    children,
    variant = "primary", // дефолтный вариант
    size = "md", // дефолтный размер
    type = "button", // по умолчанию button, но можем переопределить на submit (например, формы)
    className,
    disabled,
    ...rest // ← onClick, aria-*, data-* и т.д.
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={clsx( // Объединяем набор из нескольких стилей для кнопки
                s.button,
                s[variant], // s.primary или s.secondary
                s[size], // s.sm, s.md или s.lg
                disabled && s.disabled,
                className // внешние пользовательские классы, которые могут быть переданы с компонентом
            )}
            {...rest} // вставляем все остальные явно неупомянутые свойства в составе NativeButtonProps
        >
            {children}
        </button>
    );
}