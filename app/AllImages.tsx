import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"


import { Features, SavedImages } from './types';
import WoodImage from "./WoodImage";
import Report from "./Report";

interface Props {
    images: SavedImages
    features: Features,
}
export default function AllImages({ images, features }: Props){
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="bttn__secondary m-9 sm:mt-9">Show All</button>
            </DialogTrigger>
            <DialogContent className="w-2/3 max-w-[1200px]">
                <DialogHeader>
                    <DialogTitle>Image History</DialogTitle>
                    <DialogDescription>Scroll through processed images</DialogDescription>
                </DialogHeader>
                <Carousel
                    opts={{
                        align: "center",
                        loop: true,
                        slidesToScroll: 1,
                    }}
                    className="w-full px-12"
                >
                    <CarouselContent className="-ml-1 md:-ml-4 ">
                        {images.map(({image, data}) => (
                            <CarouselItem key={data.inference_id}>
                                <WoodImage image={image} data={data} features={features} />
                                <Report output={data} />

                            </CarouselItem>
                        ))}
                    </CarouselContent >
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>
            </DialogContent>
        </Dialog>

    )
}