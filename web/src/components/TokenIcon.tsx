import Image, { ImageProps } from "next/image";

interface TokenIconProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string;
}

const TokenIcon = ({ src, ...props }: TokenIconProps) => (
  <div {...props} className={`relative shrink-0 ${props.className}`}>
    <Image
      data-test="token-icon-image"
      alt=""
      fill={true}
      src={src ? src : "/icons/token.svg"}
      {...props}
    />
  </div>
);

export { TokenIcon };
