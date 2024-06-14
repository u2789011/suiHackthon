import React from 'react';

interface SuifrenCardProps {
  suiFrenSvg: string | null;
  isError: boolean;
}

const SuifrenCard: React.FC<SuifrenCardProps> = ({ suiFrenSvg, isError }) => {
  const defaultSvgPath = "/frens/voidfren.svg";

  return (
    <div className='sui-fren-container'>
      {isError ? (
        <img src={defaultSvgPath} alt="Default SVG" />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: suiFrenSvg || "" }} />
      )}
    </div>
  );
};

export default SuifrenCard;