import React ,{useState,useEffect} from 'react';

const Icon = ({ name, color, size }) => {
    const [IconComponent, setIconComponent] = useState(null);
    const [error, setError] = useState(false);
  
    useEffect(() => {
      const importIcon = async () => {
        try {
          const imported = await import(`../assests/fontawesome/svgs/regular/${name}.svg`);
          setIconComponent(() => imported.ReactComponent);
        } catch (err) {
          console.warn(`Icon not found: ${name}`);
          setError(true);
        }
      };
  
      importIcon();
    }, [name]);
  
    if (error) {
      return <div style={{ width: size, height: size, backgroundColor: 'lightgray' }}></div>;
    }
  
    if (!IconComponent) {
      return <div style={{ width: size, height: size }}></div>;
    }
  
    return <IconComponent style={{ width: size, height: size, fill: color }} />;
  };
  
  export default Icon;