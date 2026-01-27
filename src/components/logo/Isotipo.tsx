import Image from "next/image";

export const Isotipo = ({
  width = 32,
  height = 32,
}: {
  width?: number;
  height?: number;
}) => {
  return (
    <Image
      src="/isotipo.svg"
      alt="Fin Logo"
      width={width}
      height={height}
      className="font-semibold"
    />
  );
};
