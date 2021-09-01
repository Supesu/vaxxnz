import { Button, KIND } from "baseui/button";
import { Search } from "baseui/icon";
import { Modal } from "baseui/modal";
import { Select } from "baseui/select";
import { parse } from "date-fns";
import React, { useCallback, useContext, useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import { DateLocationsPairsContext } from "./contexts";
import { getMyCalendar } from "./getData";
import { DateLocationsPair, LocationSlotsPair } from "./types";
import { getDistanceKm } from "./distanceUtils";

function sum(array: number[]) {
  return array.reduce((a, b) => a + b, 0);
}

function App() {
  const [isOpen, setIsOpen] = React.useState<DateLocationsPair | null>(null);
  function close() {
    setIsOpen(null);
  }
  const [radiusKm, setRadiusKm] = useState(30);
  const [lat, setLat] = useState(-36.853610199274385);
  const [lng, setLng] = useState(174.76054541484535);
  const { dateLocationsPairs, setDateLocationsPairs } = useContext(
    DateLocationsPairsContext
  );
  const loadCalendar = useCallback(async () => {
    const data = await getMyCalendar(lat, lng, radiusKm);
    setDateLocationsPairs(data);
  }, [lat, lng, radiusKm, setDateLocationsPairs]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
    } else {
      navigator.geolocation.getCurrentPosition((position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      });
    }
  };

  return (
    <>
      <div className="App">
        {/* <pre>{JSON.stringify({ dateLocationsPairs }, null, 2)}</pre> */}

        <section className="App-header">
          <h1>Vaccine Timetable</h1>
          <p>
            Check vaccine timetable availability before making a booking. This
            is an unofficial website and pulls data from managemyvaccine.nz{" "}
          </p>
        </section>

        <HeaderMain>
          <Modal
            onClose={close}
            isOpen={!!isOpen}
            overrides={{
              Root: { style: { zIndex: 1500 } },
              Dialog: {
                style: {
                  width: "80vw",
                  height: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  padding: "1.5rem",
                },
              },
            }}
          >
            <ModalGrid>
              <div style={{ position: "sticky", top: "0", display: "block" }}>
                <h1>Available slots - {isOpen?.dateStr}</h1>
                <a href="https://bookmyvaccine.nz" target="_blank">
                  <Button
                    overrides={{
                      Root: { style: { width: "100%", margin: "1rem 0" } },
                    }}
                  >
                    Make a Booking
                  </Button>
                </a>
                <p>or visit bookmyvaccine.nz</p>
                <Button
                  onClick={() => setIsOpen(null)}
                  overrides={{
                    Root: { style: { width: "100%", margin: "1rem 0" } },
                  }}
                  kind={KIND.secondary}
                >
                  Back to calendar
                </Button>
              </div>

              <div style={{ overflow: "scroll" }}>
                {sortByDistance(isOpen?.locationSlotsPairs, lat, lng)
                  .filter(
                    (locationSlotsPair) => locationSlotsPair.slots?.length
                  )
                  .map((locationSlotsPair) => (
                    <VaccineCentre>
                      {/* <h3>Murihiku Medical Services</h3> */}
                      <h3>{locationSlotsPair.location.name}</h3>
                      {/* <p>Level 1, 112 Don Street, Invercargill  </p> */}
                      <p>{locationSlotsPair.location.displayAddress} ({Math.floor(getDistanceKm(lat, lng, locationSlotsPair.location.location.lat, locationSlotsPair.location.location.lng))}km away)</p>

                      <p style={{ margin: "0.75rem 0 0.5rem 0" }}>
                        Available slots:
                      </p>
                      <section>
                        {/* <p>1am</p> */}
                        {locationSlotsPair.slots?.map((slot) => (
                          <p>
                            {parse(
                              slot.localStartTime,
                              "HH:mm:ss",
                              new Date()
                            ).toLocaleTimeString("en-NZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        ))}
                      </section>
                    </VaccineCentre>
                  ))}
              </div>
            </ModalGrid>
          </Modal>
          <h1>Available Vaccine Slots</h1>
          <div style={{ zIndex: 22 }}>
            <a href="https://github.com/CovidEngine" target="_blank">
              <Button kind={KIND.secondary}>About</Button>
            </a>

            <Select
              options={[
                { label: "Whthin 30km", id: "#F0F8FF" },
                { label: "Within 60km", id: "#FAEBD7" },
                { label: "Within 90km", id: "#00FFFF" },
              ]}
              placeholder={`Within ${radiusKm}km`}
              disabled={true} // TODO: implement
            />
            <div>
              {lat}, {lng}
            </div>
            <Button
              startEnhancer={() => <Search size={24} />}
              kind={KIND.secondary}
              onClick={getLocation}
            >
              Nearby Locations
            </Button>
          </div>
        </HeaderMain>
        <CalendarContainer>
          <CalendarSectionContainer>
            <h2>September 2021</h2>
            <MonthContainer>
              {dateLocationsPairs.map((dateLocationsPair) => (
                <div onClick={() => setIsOpen(dateLocationsPair)}>
                  <h3>
                    {parse(
                      dateLocationsPair.dateStr,
                      "yyyy-MM-dd",
                      new Date()
                    ).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <p>
                    {sum(
                      dateLocationsPair.locationSlotsPairs.map(
                        (locationSlotsPair) =>
                          (locationSlotsPair.slots || []).length
                      )
                    )}{" "}
                    available
                  </p>
                </div>
              ))}
            </MonthContainer>
          </CalendarSectionContainer>
        </CalendarContainer>
      </div>
    </>
  );
}

export default App;

const HeaderMain = styled.header`
position: sticky;
display: flex;
justify-content: space-between;
box-sizing: border-box;
top: -2px;
padding: 1.5rem;
background-color: white;

  z-index: 2;

border-top: 1px solid lightgray;
border-bottom: 1px solid lightgray;
div {
  display:flex;
  flex-direction: row;
  gap:1rem;
  max-height: 48px;
}
h1 {
  text-align: left;
  margin: 0;
}


@media screen and (max-width:1024px) {
flex-direction: column;
div {
  flex-direction: column;
}
}
@media screen and (max-width:768px) {
flex-direction: column;
div {
  flex-direction: column;

}
@media screen and (max-width:500px) {
  flex-direction: column;
div {
  flex-direction: column;

}


`;

const CalendarContainer = styled.section`
  margin: 0;
`;

const CalendarSectionContainer = styled.section`
  h2 {
    display: block;
    padding: 1.5rem;
    font-size: 1.5rem;
    border-bottom: 1px solid lightgray;
    position: sticky;
    top: 96px;

    background-color: #fff;
    z-index: 1;
  }
`;

const MonthContainer = styled.section`
  display: grid;
  box-sizing: border-box;
  grid-template-columns: repeat(7, 1fr);
  background-color: lightgray;
  border-bottom: 1px solid lightgray;
  gap: 1px;
  transition: all 0.3s;
  div {
    min-height: 120px;
    background-color: white;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    h3 {
      font-size: 1.25rem;
      font-weight: 400;
    }
    p {
      font-size: 1.2rem;
      font-weight: 600;
    }
    :hover {
      background-color: #e4eeff;
      cursor: pointer;
    }
  }

  @media screen and (max-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media screen and (max-width: 500px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const ModalGrid = styled.section`
  display: grid;
  gap: 4rem;
  grid-template-columns: 480px 1fr;
  overflow: hidden;
`;

const VaccineCentre = styled.section`
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid lightgray;
  section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    p {
      border-radius: 4px;
      background-color: #444;
      color: white;
      padding: 0.5rem;
      min-width: 80px;
      text-align: center;
    }
  }
`;


export function sortBy<T = unknown>(
  notes: T[],
  comparator: (note: T) => string | number,
) {
  return [...notes].sort((a: T, b: T) => {
    if (comparator(a) < comparator(b)) {
      return -1;
    }
    if (comparator(a) > comparator(b)) {
      return 1;
    }
    return 0;
  });
}

function sortByDistance(locationSlotsPairs: LocationSlotsPair[] | undefined, lat: number, lng: number): LocationSlotsPair[] {
  return sortBy(locationSlotsPairs ?? [], locationSlotsPair => {
    const distanceKm = getDistanceKm(lat, lng, locationSlotsPair.location.location.lat, locationSlotsPair.location.location.lng)
    return distanceKm
  });
}
