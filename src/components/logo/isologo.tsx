import Image from "next/image";
import { cn } from "@/lib/utils";

interface IsologoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Isologo({
  width = 100,
  height = 100,
  className,
}: IsologoProps) {
  return (
    <Image
      src="/isologo.svg"
      alt="FIN isologo"
      width={width}
      height={height}
      className={cn(className)}
    />
  );
}
