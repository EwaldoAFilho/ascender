"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const CLASSE: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

/**
 * Botão padronizado. Reaproveita as classes já existentes (btn-primary,
 * btn-secondary, btn-danger) e adiciona a variante `ghost`. Não altera os
 * botões atuais — é opt-in para conteúdo novo.
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", className = "", type = "button", ...rest },
  ref,
) {
  const cls = `${CLASSE[variant]}${className ? ` ${className}` : ""}`;
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
