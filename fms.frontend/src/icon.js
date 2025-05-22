import React, { useState, useEffect } from "react";

const Icon = ({ name, color, size, style = "regular" }) => {
  const [IconComponent, setIconComponent] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Array of styles to check in order
    const stylesToCheck = style
      ? [style]
      : ["solid", "regular", "brands", "light", "duotone", "thin"];

    const importIcon = async () => {
      let iconFound = false;

      // Try each style until we find the icon
      for (const styleType of stylesToCheck) {
        if (iconFound) break;

        try {
          const imported = await import(
            `../assests/fontawesome/svgs/${styleType}/${name}.svg`
          );
          setIconComponent(() => imported.ReactComponent);
          iconFound = true;
        } catch (err) {
          // Continue to the next style if icon not found in current style
          continue;
        }
      }

      if (!iconFound) {
        console.warn(`Icon not found: ${name}`);
        setError(true);
      }
    };

    importIcon();
  }, [name, style]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: "lightgray" }}
      ></div>
    );
  }

  if (!IconComponent) {
    return <div style={{ width: size, height: size }}></div>;
  }

  return <IconComponent style={{ width: size, height: size, fill: color }} />;
};

export default Icon;
