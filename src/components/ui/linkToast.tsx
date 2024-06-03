import React from 'react';
import { toast } from 'react-toastify';

interface LinkToastProps {
  message: string;
  explorerUrl: string;
}

const LinkToast: React.FC<LinkToastProps> = ({ message, explorerUrl }) => (
  <span>
    {message}
    <div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "lightblue", textDecoration: "underline" }}
      >
        View on Blockchain
      </a>
    </div>
  </span>
);

export const showToast = (message: string, explorerUrl:string) => {
  toast.success(<LinkToast message={message} explorerUrl={explorerUrl} />);
};

export default LinkToast;