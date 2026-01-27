import Image from "next/image";

interface IsologoProps {
  width?: number;
  height?: number;
}

export default function Isologo({ width = 100, height = 100 }: IsologoProps) {
  return (
    <Image src="/isologo.svg" alt="FIN isologo" width={width} height={height} />
  );
}
