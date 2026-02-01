import React from "react";
import { Tooltip } from "antd";
import { Icon } from "@iconify/react";
import "./IconButton.css";

/**
 * IconButton Component - Custom button with glowing border and MDI icons
 *
 * Props:
 * - icon: Iconify icon name (e.g., 'mdi:pencil', 'mdi:delete')
 * - variant: 'edit'|'delete'|'view'|'add'|'primary'|'secondary'|'download'|'upload'|'refresh'
 * - size: 'small'|'medium'|'large'
 * - tooltip: string
 * - showLabel: boolean
 * - label: string (overrides default label)
 * - onClick: fn
 * - disabled: boolean
 * - className: additional classes
 */
const IconButton = ({
  icon,
  variant = "primary",
  size = "medium",
  tooltip,
  showLabel = false,
  label,
  onClick,
  disabled = false,
  className = "",
  ...props
}) => {
  const iconSizes = { small: 16, medium: 18, large: 20 };
  const sizeValue = iconSizes[size] || iconSizes.medium;

  const variantConfig = {
    edit: {
      icon: icon || "mdi:pencil",
      label: label || "Edit",
    },
    delete: {
      icon: icon || "mdi:delete",
      label: label || "Delete",
    },
    view: {
      icon: icon || "mdi:eye",
      label: label || "View",
    },
    add: {
      icon: icon || "mdi:plus",
      label: label || "Add",
    },
    download: {
      icon: icon || "mdi:download",
      label: label || "Download",
    },
    upload: {
      icon: icon || "mdi:upload",
      label: label || "Upload",
    },
    refresh: {
      icon: icon || "mdi:refresh",
      label: label || "Refresh",
    },
    secondary: {
      icon: icon || "mdi:close",
      label: label || "Cancel",
    },
    primary: {
      icon: icon || "mdi:check",
      label: label || "Action",
    },
  };

  const config = variantConfig[variant] || variantConfig.primary;
  const finalIcon = icon || config.icon;

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`icon-button icon-button-${variant} icon-button-${size} ${className}`}
      aria-label={tooltip || config.label}
      {...props}
    >
      <Icon icon={finalIcon} width={sizeValue} height={sizeValue} />
      {showLabel && <span className="icon-button-label">{config.label}</span>}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default IconButton;
