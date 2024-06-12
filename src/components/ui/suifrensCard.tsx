import { Card, CardBody, CardFooter, ScrollShadow, Button } from '@nextui-org/react';

interface SuifrenCardProps {
  suiFrenSvg: string | null;
}

const SuifrensCard: React.FC<SuifrenCardProps> = ({ suiFrenSvg }) => {
    const defaultSvgPath = "/frens/voidfren.svg";
    return (
        <Card className="h-auto w-[140px] shadow-lg rounded-2xl overflow-hidden">
            <CardBody className="relative p-0">
                {suiFrenSvg ? (
                <div
                className="sui-fren-image"
                dangerouslySetInnerHTML={{ __html: suiFrenSvg }}
                />
            ) : (
                <img
                    src={defaultSvgPath}
                    alt='Void Fren'
                    className='sui-fren-image'
                />
            )}
            </CardBody>
        </Card>
    );
};

export default SuifrensCard;