import React from "react";

const TailwindExample = () => {
  return (
    <div className="tw-p-4 tw-bg-gray-100 tw-rounded-lg tw-shadow-md">
      <h2 className="tw-text-xl tw-font-bold tw-text-blue-600 tw-mb-2">
        Tailwind CSS Example
      </h2>
      <p className="tw-text-gray-700">
        This component uses Tailwind CSS with the{" "}
        <span className="tw-font-semibold">tw-</span> prefix to avoid conflicts
        with DevExtreme.
      </p>
      <div className="tw-mt-4 tw-flex tw-gap-2">
        <button className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded tw-hover:bg-blue-600">
          Primary Button
        </button>
        <button className="tw-px-4 tw-py-2 tw-bg-gray-200 tw-text-gray-800 tw-rounded tw-hover:bg-gray-300">
          Secondary Button
        </button>
      </div>
    </div>
  );
};

export default TailwindExample;
