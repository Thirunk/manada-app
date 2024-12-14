import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowLeftLong,
} from "@fortawesome/free-solid-svg-icons";

function ImageSlider() {
  let arr_of_imgs = [
    "machine1.jpg",
    "machine2.jpg",
    "machine3.jpg",
    "machine4.jpg",
    // "https://images.unsplash.com/photo-1527049979667-990f1d0d8e7f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8YmFja2dyb3VuZHx8fHx8fDE3MDExOTIwMDE&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1483232539664-d89822fb5d3e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8YmFja2dyb3VuZHx8fHx8fDE3MDExOTIwMTA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1541450805268-4822a3a774ca?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8YmFja2dyb3VuZHx8fHx8fDE3MDExOTIwMjA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1542461927-dd68c85adc56?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8YmFja2dyb3VuZHx8fHx8fDE3MDExOTQ4NDg&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1644258063048-115a8d344aa6?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8c3BlY2llc3x8fHx8fDE3MDExOTQ5Mjk&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8YmFja2dyb3VuZHx8fHx8fDE3MDExOTQ5Mzg&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
    // "https://images.unsplash.com/photo-1593029098077-ee36a677007c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=900&ixid=MnwxfDB8MXxyYW5kb218MHx8U3BpY2VzfHx8fHx8MTcwMTE5NTAwMQ&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1600",
  ];

  let [counter, setCounter] = useState(0);

  function preImage() {
    if (counter > 0) {
      setCounter(--counter);
    } else {
      setCounter(arr_of_imgs.length - 1);
    }
  }

  function nextImage() {
    if (counter < arr_of_imgs.length - 1) {
      setCounter(++counter);
    } else {
      setCounter(0);
    }
  }

  const imgStyle = {
    // transform: "translateX(280px) translateY(0px)",
    border: "5px solid #fff",
    boxShadow: "2px 2px 20px 2px black",
  };
  // const arrowIcon = {
  //   fontSize: "25px",
  // };
  return (
    <div className="mb-10 mt-10 flex justify-center">
      <div>
        <button
          onClick={preImage}
          style={{
            position: "absolute",
            top: "42%",
            left: "5%",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "5px solid grey",
          }}
        >
          <FontAwesomeIcon icon={faArrowLeftLong} />
        </button>
      </div>
      <div>
        <img
          className="h-60 w-96 object-cover"
          src={arr_of_imgs[counter]}
          style={imgStyle}
        />
      </div>
      <div>
        <button
          style={{
            position: "absolute",
            top: "42%",
            left: "90%",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "5px solid grey",
          }}
          onClick={nextImage}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );
}

export default ImageSlider;
