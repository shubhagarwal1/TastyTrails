// eslint-disable-next-line no-unused-vars
import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faHeart,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "../App.css";

// Cards Component for Creating Recipe Cards
const Cards = ({ dish, setRecipes, recipes, index }) => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData")) || null;
  const [liked, setLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(dish.likes); // Initialize with the dish's total likes
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const shareButton = useRef(null);
  const recipeId = dish._id;

  // Checks if user is authenticated or not
  const handleClick = async () => {
    const token = await JSON.parse(localStorage.getItem("tastytoken"));
    if (token !== null) {
      // here passing logged in username as well for comment use
      navigate(`/recipe/${dish._id}`, { state: { dish } });
    } else {
      toast.info("Please Login First");
      navigate("/login");
    }
  };
  useEffect(() => {
    // Check if the dish is liked by the user when the component mounts
    if (userData && userData.likedRecipes.includes(dish._id)) {
      setLiked(true);
    }
  }, [dish]);
  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      const token = await JSON.parse(localStorage.getItem("tastytoken"));
      if (token == null) {
        toast.info("Please Login First");
        navigate("/login");
      }
      if (token !== null) {
        const updateShareCount = await axios.patch(
          `${backendURL}/api/recipe/share/${recipeId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (updateShareCount.status === 200) {
          const postURL = window.location.origin + "/recipe/" + dish._id;
          const updatedRecipes = [...recipes];
          // Update the share count for the specific index
          updatedRecipes[index] = {
            ...updatedRecipes[index], // Spread the existing recipe object
            share: updatedRecipes[index].share + 1, // Increase the share value
          };

          setRecipes(updatedRecipes);
          navigate.clipboard.writeText(postURL);
          toast.success("Copied!");
        } else {
          toast.info(updateShareCount.message || "Something went wrong");
        }
      }
    } catch (error) {
      toast.info("Something went wrong");
    }
  };

  const handleLikeClick = async () => {
    const token = await JSON.parse(localStorage.getItem("tastytoken"));
    if (!token) {
      toast.info("Please login first");
      navigate("/login");
      return;
    }

    try {
      let response;
      if (!liked) {
        // Call the API to like the recipe first
        response = await axios.post(
          `${backendURL}/api/recipe/like`,
          { recipeId: dish._id, userId: userData._id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Update totalLikes only after the API response
        setTotalLikes(response.data.totalLikes);
        setLiked(true);
      } else {
        // Call the API to unlike the recipe first
        response = await axios.post(
          `${backendURL}/api/recipe/unlike`,
          { recipeId: dish._id, userId: userData._id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Update totalLikes only after the API response
        setTotalLikes(response.data.totalLikes);
        setLiked(false);
      }

      // Update liked recipes in local storage
      if (liked) {
        userData.likedRecipes = userData.likedRecipes.filter(
          (id) => id !== dish._id
        );
      } else {
        userData.likedRecipes.push(dish._id);
      }
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (

    <div className="p-4 cursor-pointer" onClick={handleClick}>
      <div className="border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
        <img
          className="lg:h-48 md:h-36 w-full object-cover object-center cursor-pointer"
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          onClick={handleClick}
        />
        <div className="p-6">
          <h2 className="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">
            {dish.type.join(", ")}
          </h2>
          <h1 className="title-font text-lg font-medium text-gray-900 mb-3">
            {dish.name}
          </h1>
          <p className="leading-relaxed mb-3 clamped-text">
            {dish.description.slice(0, 174)}
            {dish.description.length > 174 ? "..." : null}
          </p>
          <div className="flex items-center flex-wrap">
            <span
              className="text-red-500 inline-flex items-center md:mb-2 lg:mb-0 cursor-pointer"
              onClick={handleClick}
            >
              Recipe <FontAwesomeIcon icon={faArrowRight} />
            </span>
            <span
              className={`text-gray-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200 cursor-pointer ${
                liked ? "text-red-500" : ""
              }`}
              onClick={handleLikeClick}
            >
              <FontAwesomeIcon icon={faHeart} className="mx-2" />
              {totalLikes} {/* Display the global like count */}
            </span>
            <span
              className="text-gray-400 inline-flex items-center leading-none text-sm cursor-pointer"
              onClick={handleShare}
            >
              <FontAwesomeIcon
                ref={shareButton}
                icon={faShare}
                className="mx-2"
              />
              {dish.share}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

Cards.propTypes = {
  dish: PropTypes.object.isRequired
};

export default Cards;